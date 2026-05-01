import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactBasicForm() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Basic Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form>
              <FieldGroup>
                <FieldSet>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="name">Name *</FieldLabel>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Jane Doe"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="email">Email *</FieldLabel>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="jane@example.com"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="message">Message *</FieldLabel>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Write your message..."
                        className="min-h-[120px] resize-none"
                        required
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>
                <Field orientation="horizontal">
                  <Button type="submit">Submit</Button>
                  <Button type="reset" variant="outline">
                    Reset
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
