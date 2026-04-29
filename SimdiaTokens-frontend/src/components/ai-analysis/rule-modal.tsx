"use client";

import { motion } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Loader2 } from "lucide-react";

interface PrefilledRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenId: string;
  defaultRuleName?: string;
  defaultConditionField?: "subject" | "sender" | "body";
  defaultConditionValue?: string;
}

interface RuleFormValues {
  ruleName: string;
  conditionField: "subject" | "sender" | "body";
  conditionOperator: "contains" | "equals";
  conditionValue: string;
  action: "forward" | "mark_read" | "delete" | "move_to_folder";
  actionTarget: string;
}

export function PrefilledRuleModal({
  open,
  onOpenChange,
  tokenId,
  defaultRuleName = "",
  defaultConditionField = "subject",
  defaultConditionValue = "",
}: PrefilledRuleModalProps) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting, isSubmitSuccessful },
  } = useForm<RuleFormValues>({
    defaultValues: {
      ruleName: defaultRuleName,
      conditionField: defaultConditionField,
      conditionOperator: "contains",
      conditionValue: defaultConditionValue,
      action: "forward",
      actionTarget: "",
    },
  });

  const action = watch("action");
  const needsTarget = action === "forward" || action === "move_to_folder";

  const onSubmit = async (data: RuleFormValues) => {
    try {
      await fetch(`/api/rules/create?token_id=${encodeURIComponent(tokenId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleName: data.ruleName,
          condition: {
            field: data.conditionField,
            operator: data.conditionOperator,
            value: data.conditionValue,
          },
          action: {
            type: data.action,
            target: data.actionTarget || undefined,
          },
        }),
      });
    } catch {
      console.log("Create Rule:", { tokenId, ...data });
    }
    setTimeout(() => {
      reset();
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden glass-strong border-white/10">
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <DialogHeader className="px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">Create Inbox Rule</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Create a mail flow rule based on AI finding
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Rule Name
              </label>
              <Input
                {...register("ruleName", { required: true })}
                placeholder="e.g. Forward sensitive emails"
                className="mt-1.5 bg-secondary/50 border-white/5"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Condition
              </label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                <Controller
                  control={control}
                  name="conditionField"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-secondary/50 border-white/5 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-strong border-white/10">
                        <SelectItem value="subject">Subject</SelectItem>
                        <SelectItem value="sender">Sender</SelectItem>
                        <SelectItem value="body">Body</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <Controller
                  control={control}
                  name="conditionOperator"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-secondary/50 border-white/5 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-strong border-white/10">
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="equals">Equals</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <Input
                  {...register("conditionValue")}
                  placeholder="Value..."
                  className="h-8 text-xs bg-secondary/50 border-white/5"
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Action
              </label>
              <div className="mt-1.5 space-y-2">
                <Controller
                  control={control}
                  name="action"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-secondary/50 border-white/5 h-8 text-xs w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-strong border-white/10">
                        <SelectItem value="forward">Forward to email</SelectItem>
                        <SelectItem value="mark_read">Mark as read</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                        <SelectItem value="move_to_folder">Move to folder</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {needsTarget && (
                  <Input
                    {...register("actionTarget")}
                    placeholder={action === "forward" ? "forward-to@email.com" : "Folder name e.g. Archive"}
                    className="h-8 text-xs bg-secondary/50 border-white/5"
                    autoComplete="off"
                  />
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-white/5 flex items-center gap-3">
            {isSubmitSuccessful ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-emerald-400 text-xs"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                Rule created successfully
              </motion.div>
            ) : (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="border-white/10">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Shield className="h-3.5 w-3.5" />
                  )}
                  Create Rule
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
