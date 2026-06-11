"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchContacts,
  createContact,
  updateContact,
  deleteContact,
  GraphContact,
} from "@/lib/api";
import {
  ArrowLeft, Plus, Search, Loader2, Mail, Phone, Building2, Briefcase,
  MapPin, Trash2, Edit3, User, X, Check, Users, Contact,
} from "lucide-react";

interface ContactsViewProps {
  tokenId: string;
  onBack: () => void;
}

export default function ContactsView({ tokenId, onBack }: ContactsViewProps) {
  const [contacts, setContacts] = useState<GraphContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<GraphContact | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formGivenName, setFormGivenName] = useState("");
  const [formSurname, setFormSurname] = useState("");
  const [formEmails, setFormEmails] = useState("");
  const [formPhones, setFormPhones] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formJobTitle, setFormJobTitle] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formOffice, setFormOffice] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const loadContacts = useCallback(async () => {
    if (!tokenId) return;
    setLoading(true);
    try {
      const data = await fetchContacts(tokenId);
      setContacts(data.contacts || []);
    } catch (err: any) {
      toast.error("Failed to load contacts", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const resetForm = () => {
    setFormDisplayName("");
    setFormGivenName("");
    setFormSurname("");
    setFormEmails("");
    setFormPhones("");
    setFormMobile("");
    setFormJobTitle("");
    setFormCompany("");
    setFormDepartment("");
    setFormOffice("");
    setFormNotes("");
  };

  const populateForm = (contact: GraphContact) => {
    setFormDisplayName(contact.displayName || "");
    setFormGivenName(contact.givenName || "");
    setFormSurname(contact.surname || "");
    setFormEmails(contact.emailAddresses?.map(e => e.address).filter(Boolean).join(", ") || "");
    setFormPhones(contact.businessPhones?.join(", ") || "");
    setFormMobile(contact.mobilePhone || "");
    setFormJobTitle(contact.jobTitle || "");
    setFormCompany(contact.companyName || "");
    setFormDepartment(contact.department || "");
    setFormOffice(contact.officeLocation || "");
    setFormNotes(contact.personalNotes || "");
  };

  const handleCreateContact = async () => {
    if (!tokenId || !formDisplayName.trim()) return;
    setSaving(true);
    try {
      const emails = formEmails.split(",").map(e => e.trim()).filter(Boolean);
      const phones = formPhones.split(",").map(p => p.trim()).filter(Boolean);
      
      await createContact(tokenId, {
        display_name: formDisplayName.trim(),
        given_name: formGivenName.trim() || undefined,
        surname: formSurname.trim() || undefined,
        email_addresses: emails,
        business_phones: phones.length > 0 ? phones : undefined,
        mobile_phone: formMobile.trim() || undefined,
        job_title: formJobTitle.trim() || undefined,
        company_name: formCompany.trim() || undefined,
        department: formDepartment.trim() || undefined,
        office_location: formOffice.trim() || undefined,
        personal_notes: formNotes.trim() || undefined,
      });
      
      toast.success("Contact created");
      setCreateDialogOpen(false);
      resetForm();
      loadContacts();
    } catch (err: any) {
      toast.error("Failed to create contact", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateContact = async () => {
    if (!tokenId || !selectedContact || !formDisplayName.trim()) return;
    setSaving(true);
    try {
      const emails = formEmails.split(",").map(e => e.trim()).filter(Boolean);
      const phones = formPhones.split(",").map(p => p.trim()).filter(Boolean);
      
      await updateContact(tokenId, selectedContact.id, {
        display_name: formDisplayName.trim(),
        given_name: formGivenName.trim() || undefined,
        surname: formSurname.trim() || undefined,
        email_addresses: emails,
        business_phones: phones.length > 0 ? phones : undefined,
        mobile_phone: formMobile.trim() || undefined,
        job_title: formJobTitle.trim() || undefined,
        company_name: formCompany.trim() || undefined,
        department: formDepartment.trim() || undefined,
        office_location: formOffice.trim() || undefined,
        personal_notes: formNotes.trim() || undefined,
      });
      
      toast.success("Contact updated");
      setEditDialogOpen(false);
      resetForm();
      setSelectedContact(null);
      loadContacts();
    } catch (err: any) {
      toast.error("Failed to update contact", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!tokenId || !confirm("Delete this contact?")) return;
    try {
      await deleteContact(tokenId, contactId);
      toast.success("Contact deleted");
      setSelectedContact(null);
      loadContacts();
    } catch (err: any) {
      toast.error("Failed to delete contact", { description: err.message });
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const q = searchQuery.toLowerCase();
    return (
      contact.displayName?.toLowerCase().includes(q) ||
      contact.givenName?.toLowerCase().includes(q) ||
      contact.surname?.toLowerCase().includes(q) ||
      contact.emailAddresses?.some(e => e.address?.toLowerCase().includes(q)) ||
      contact.companyName?.toLowerCase().includes(q) ||
      contact.jobTitle?.toLowerCase().includes(q)
    );
  });

  const getInitials = (contact: GraphContact) => {
    const name = contact.displayName || contact.givenName || "";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  };

  const getPrimaryEmail = (contact: GraphContact) => {
    return contact.emailAddresses?.[0]?.address || "No email";
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0f1115]">
      {/* Contacts Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2e37]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Mail
          </button>
          <div className="h-4 w-px bg-[#2a2e37]" />
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#0f6cbd]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">People</h2>
          </div>
          <Badge variant="outline" className="text-[10px] bg-[#0f6cbd]/10 text-[#0f6cbd] border-[#0f6cbd]/20">
            {contacts.length} contacts
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748b]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="pl-9 w-64 h-8 text-xs bg-[#1a1d24] border-[#2a2e37] text-[#e2e8f0]"
            />
          </div>
          <Button size="sm" onClick={() => { resetForm(); setCreateDialogOpen(true); }} className="bg-[#0f6cbd] hover:bg-[#0f6cbd]/90 text-white h-8 text-xs gap-1">
            <Plus className="h-3.5 w-3.5" /> New Contact
          </Button>
        </div>
      </div>

      {/* Contacts Content */}
      <div className="flex-1 flex min-h-0">
        {/* Contacts List */}
        <div className="w-[380px] flex-shrink-0 border-r border-[#2a2e37] flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-[#0f6cbd]" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#94a3b8]">
              <Users className="h-12 w-12 mb-3 text-[#2a2e37]" />
              <p className="text-sm">No contacts found</p>
              <p className="text-xs text-[#64748b] mt-1">{searchQuery ? "Try a different search" : "Add a new contact to get started"}</p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="divide-y divide-[#2a2e37]">
                {filteredContacts.map((contact, index) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => setSelectedContact(contact)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[#1a1d24]",
                      selectedContact?.id === contact.id && "bg-[#1a1d24] border-l-2 border-l-[#0f6cbd]"
                    )}
                  >
                    <div className="h-10 w-10 rounded-full bg-[#0f6cbd]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-[#0f6cbd]">{getInitials(contact)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#e2e8f0] truncate">{contact.displayName || "Unnamed"}</p>
                      <p className="text-xs text-[#64748b] truncate">{getPrimaryEmail(contact)}</p>
                    </div>
                    {contact.companyName && (
                      <Badge variant="outline" className="text-[9px] bg-[#1a1d24] text-[#94a3b8] border-[#2a2e37] flex-shrink-0">
                        {contact.companyName}
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Contact Details */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#0f1115]">
          {selectedContact ? (
            <div className="flex-1 overflow-y-auto">
              {/* Contact Header */}
              <div className="px-6 py-6 border-b border-[#2a2e37]">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-[#0f6cbd]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-semibold text-[#0f6cbd]">{getInitials(selectedContact)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-[#e2e8f0]">{selectedContact.displayName || "Unnamed"}</h2>
                    {selectedContact.jobTitle && (
                      <p className="text-sm text-[#94a3b8] mt-0.5">{selectedContact.jobTitle}</p>
                    )}
                    {selectedContact.companyName && (
                      <p className="text-sm text-[#64748b] mt-0.5">{selectedContact.companyName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        populateForm(selectedContact);
                        setEditDialogOpen(true);
                      }}
                      className="p-2 rounded-lg border border-[#2a2e37] hover:bg-[#1a1d24] transition-colors"
                    >
                      <Edit3 className="h-4 w-4 text-[#94a3b8]" />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(selectedContact.id)}
                      className="p-2 rounded-lg border border-[#2a2e37] hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-rose-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="px-6 py-4 space-y-4">
                {/* Email */}
                {selectedContact.emailAddresses && selectedContact.emailAddresses.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Email</h3>
                    {selectedContact.emailAddresses.map((email, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                        <Mail className="h-4 w-4 text-[#0f6cbd]" />
                        <a href={`mailto:${email.address}`} className="text-[#0f6cbd] hover:underline">
                          {email.address}
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Phone */}
                {(selectedContact.businessPhones?.length || selectedContact.mobilePhone) && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Phone</h3>
                    {selectedContact.businessPhones?.map((phone, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                        <Phone className="h-4 w-4 text-[#0f6cbd]" />
                        <span>{phone}</span>
                        <Badge variant="outline" className="text-[9px] bg-[#1a1d24] text-[#94a3b8] border-[#2a2e37]">Business</Badge>
                      </div>
                    ))}
                    {selectedContact.mobilePhone && (
                      <div className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                        <Phone className="h-4 w-4 text-[#0f6cbd]" />
                        <span>{selectedContact.mobilePhone}</span>
                        <Badge variant="outline" className="text-[9px] bg-[#1a1d24] text-[#94a3b8] border-[#2a2e37]">Mobile</Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Work */}
                {(selectedContact.jobTitle || selectedContact.companyName || selectedContact.department || selectedContact.officeLocation) && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Work</h3>
                    {selectedContact.jobTitle && (
                      <div className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                        <Briefcase className="h-4 w-4 text-[#0f6cbd]" />
                        <span>{selectedContact.jobTitle}</span>
                      </div>
                    )}
                    {selectedContact.companyName && (
                      <div className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                        <Building2 className="h-4 w-4 text-[#0f6cbd]" />
                        <span>{selectedContact.companyName}</span>
                      </div>
                    )}
                    {selectedContact.department && (
                      <div className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                        <Users className="h-4 w-4 text-[#0f6cbd]" />
                        <span>{selectedContact.department}</span>
                      </div>
                    )}
                    {selectedContact.officeLocation && (
                      <div className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                        <MapPin className="h-4 w-4 text-[#0f6cbd]" />
                        <span>{selectedContact.officeLocation}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {selectedContact.personalNotes && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Notes</h3>
                    <p className="text-sm text-[#94a3b8] bg-[#1a1d24] rounded-lg p-3">{selectedContact.personalNotes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Contact className="h-16 w-16 text-[#2a2e37] mx-auto mb-3" />
                <p className="text-sm text-[#94a3b8]">Select a contact to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Contact Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-[#1a1d24] border-[#2a2e37]">
          <DialogHeader>
            <DialogTitle className="text-[#e2e8f0]">New Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-xs text-[#94a3b8]">Display Name *</label>
              <Input value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)} placeholder="John Doe" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#94a3b8]">First Name</label>
                <Input value={formGivenName} onChange={(e) => setFormGivenName(e.target.value)} placeholder="John" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8]">Last Name</label>
                <Input value={formSurname} onChange={(e) => setFormSurname(e.target.value)} placeholder="Doe" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#94a3b8]">Email Addresses (comma-separated)</label>
              <Input value={formEmails} onChange={(e) => setFormEmails(e.target.value)} placeholder="john@example.com, jdoe@company.com" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#94a3b8]">Business Phones</label>
                <Input value={formPhones} onChange={(e) => setFormPhones(e.target.value)} placeholder="+1 555-0123" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8]">Mobile Phone</label>
                <Input value={formMobile} onChange={(e) => setFormMobile(e.target.value)} placeholder="+1 555-0456" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#94a3b8]">Job Title</label>
                <Input value={formJobTitle} onChange={(e) => setFormJobTitle(e.target.value)} placeholder="Software Engineer" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8]">Company</label>
                <Input value={formCompany} onChange={(e) => setFormCompany(e.target.value)} placeholder="Acme Inc" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#94a3b8]">Department</label>
                <Input value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)} placeholder="Engineering" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8]">Office Location</label>
                <Input value={formOffice} onChange={(e) => setFormOffice(e.target.value)} placeholder="Building A, Floor 3" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#94a3b8]">Personal Notes</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Add notes..."
                rows={3}
                className="w-full bg-[#0f1115] border border-[#2a2e37] rounded-lg text-xs text-[#e2e8f0] p-2 outline-none focus-visible:ring-1 focus-visible:ring-[#0f6cbd] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setCreateDialogOpen(false); resetForm(); }} className="border-[#2a2e37]">Cancel</Button>
            <Button size="sm" onClick={handleCreateContact} disabled={saving || !formDisplayName.trim()} className="bg-[#0f6cbd] hover:bg-[#0f6cbd]/90 text-white gap-1">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Plus className="h-3.5 w-3.5" /> Create Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-[#1a1d24] border-[#2a2e37]">
          <DialogHeader>
            <DialogTitle className="text-[#e2e8f0]">Edit Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {/* Same form fields as create */}
            <div>
              <label className="text-xs text-[#94a3b8]">Display Name *</label>
              <Input value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)} placeholder="John Doe" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#94a3b8]">First Name</label>
                <Input value={formGivenName} onChange={(e) => setFormGivenName(e.target.value)} placeholder="John" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8]">Last Name</label>
                <Input value={formSurname} onChange={(e) => setFormSurname(e.target.value)} placeholder="Doe" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#94a3b8]">Email Addresses (comma-separated)</label>
              <Input value={formEmails} onChange={(e) => setFormEmails(e.target.value)} placeholder="john@example.com, jdoe@company.com" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#94a3b8]">Business Phones</label>
                <Input value={formPhones} onChange={(e) => setFormPhones(e.target.value)} placeholder="+1 555-0123" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8]">Mobile Phone</label>
                <Input value={formMobile} onChange={(e) => setFormMobile(e.target.value)} placeholder="+1 555-0456" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#94a3b8]">Job Title</label>
                <Input value={formJobTitle} onChange={(e) => setFormJobTitle(e.target.value)} placeholder="Software Engineer" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8]">Company</label>
                <Input value={formCompany} onChange={(e) => setFormCompany(e.target.value)} placeholder="Acme Inc" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#94a3b8]">Department</label>
                <Input value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)} placeholder="Engineering" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8]">Office Location</label>
                <Input value={formOffice} onChange={(e) => setFormOffice(e.target.value)} placeholder="Building A, Floor 3" className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#94a3b8]">Personal Notes</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Add notes..."
                rows={3}
                className="w-full bg-[#0f1115] border border-[#2a2e37] rounded-lg text-xs text-[#e2e8f0] p-2 outline-none focus-visible:ring-1 focus-visible:ring-[#0f6cbd] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setEditDialogOpen(false); resetForm(); }} className="border-[#2a2e37]">Cancel</Button>
            <Button size="sm" onClick={handleUpdateContact} disabled={saving || !formDisplayName.trim()} className="bg-[#0f6cbd] hover:bg-[#0f6cbd]/90 text-white gap-1">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Check className="h-3.5 w-3.5" /> Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
