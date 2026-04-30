import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export interface ContactFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ContactForm({ className, ...props }: ContactFormProps) {
  return (
    <Card className={cn("w-full", className)} {...props}>
      <CardHeader>
        <CardTitle>Send us a message</CardTitle>
      </CardHeader>
      <CardContent>
        <form>
          <FieldGroup>
            <FieldSet>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="firstName">First Name *</FieldLabel>
                    <Input id="firstName" placeholder="John" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="lastName">Last Name *</FieldLabel>
                    <Input id="lastName" placeholder="Doe" required />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="email">Email *</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="subject">Subject *</FieldLabel>
                  <Input id="subject" placeholder="How can we help?" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="message">Message *</FieldLabel>
                  <Textarea
                    id="message"
                    placeholder="Your message..."
                    className="min-h-[120px] resize-none"
                    required
                  />
                </Field>
              </FieldGroup>
            </FieldSet>
            <Field orientation="horizontal">
              <Button type="submit">Send Message</Button>
              <Button type="reset">Clear</Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
