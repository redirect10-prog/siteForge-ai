import { useState } from "react";
import { Copy, Check, Database, Code, FileCode, Server, Loader2, Shield, Users, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { BackendSpec, GeneratedBackendCode } from "@/hooks/useStreamingGeneration";

interface BackendCodeDisplayProps {
  backend: BackendSpec | undefined;
  generatedCode: GeneratedBackendCode | null;
  isGenerating: boolean;
  onGenerateCode: () => void;
}

export function BackendCodeDisplay({
  backend,
  generatedCode,
  isGenerating,
  onGenerateCode,
}: BackendCodeDisplayProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  if (!backend) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, label)}
      className="h-8 gap-2"
    >
      {copiedItem === label ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy
        </>
      )}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Backend Overview */}
      <div className="rounded-lg border border-border bg-secondary/30 p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          Backend Features
        </h3>
        <div className="flex flex-wrap gap-2">
          {backend.features.map((feature) => (
            <span
              key={feature}
              className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Authentication System */}
      {backend.hasAuth && backend.authConfig && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Authentication System
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Providers:</span>
                <span className="font-medium">{backend.authConfig.providers.join(", ")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Roles:</span>
                <span className="font-medium">{backend.authConfig.roles.join(", ")}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Email Verification:</span>{" "}
                <span className={backend.authConfig.requireEmailVerification ? "text-green-500" : "text-muted-foreground"}>
                  {backend.authConfig.requireEmailVerification ? "Required" : "Optional"}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Public Signup:</span>{" "}
                <span className={backend.authConfig.allowSignup ? "text-green-500" : "text-orange-500"}>
                  {backend.authConfig.allowSignup ? "Enabled" : "Invite Only"}
                </span>
              </div>
            </div>
          </div>
          {backend.authConfig.userProfileFields.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground">Profile Fields: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {backend.authConfig.userProfileFields.map((field) => (
                  <code key={field} className="text-xs px-2 py-0.5 bg-secondary rounded">
                    {field}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Database Tables */}
      <div className="rounded-lg border border-border bg-secondary/30 p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Database Tables
        </h3>
        <div className="space-y-3">
          {backend.database.tables.map((table) => (
            <div key={table.name} className="bg-background/50 rounded-lg p-3">
              <div className="font-medium text-sm text-primary">{table.name}</div>
              <div className="text-xs text-muted-foreground mb-2">
                {table.description}
              </div>
              <div className="text-xs space-y-1">
                {table.columns.map((col) => (
                  <div key={col.name} className="flex items-center gap-2">
                    <code className="bg-secondary/50 px-1.5 py-0.5 rounded">
                      {col.name}
                    </code>
                    <span className="text-muted-foreground">{col.type}</span>
                    {!col.nullable && (
                      <span className="text-xs text-orange-500">required</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Forms */}
      {backend.forms.length > 0 && (
        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            Forms
          </h3>
          <div className="space-y-3">
            {backend.forms.map((form) => (
              <div key={form.id} className="bg-background/50 rounded-lg p-3">
                <div className="font-medium text-sm">{form.name}</div>
                <div className="text-xs text-muted-foreground mb-2">
                  {form.description}
                </div>
                <div className="text-xs space-y-1">
                  {form.fields.map((field) => (
                    <div key={field.name} className="flex items-center gap-2">
                      <code className="bg-secondary/50 px-1.5 py-0.5 rounded">
                        {field.name}
                      </code>
                      <span className="text-muted-foreground">{field.type}</span>
                      {field.required && (
                        <span className="text-xs text-orange-500">required</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Code Button */}
      {!generatedCode && (
        <Button
          variant="gradient"
          onClick={onGenerateCode}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Code...
            </>
          ) : (
            <>
              <Code className="mr-2 h-4 w-4" />
              Generate Backend Code
            </>
          )}
        </Button>
      )}

      {/* Generated Code */}
      {generatedCode && (
        <Tabs defaultValue="sql" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sql">SQL Schema</TabsTrigger>
            <TabsTrigger value="forms">Form Components</TabsTrigger>
            <TabsTrigger value="api">API Functions</TabsTrigger>
          </TabsList>

          <TabsContent value="sql" className="mt-4">
            <div className="rounded-lg border border-border bg-secondary/30">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <span className="text-sm font-medium">Database Schema (SQL)</span>
                <CopyButton text={generatedCode.sql} label="SQL Schema" />
              </div>
              <pre className="p-4 text-xs overflow-x-auto max-h-96">
                <code className="text-muted-foreground whitespace-pre">
                  {generatedCode.sql}
                </code>
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="forms" className="mt-4 space-y-4">
            {generatedCode.forms.map((form) => (
              <div
                key={form.id}
                className="rounded-lg border border-border bg-secondary/30"
              >
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <span className="text-sm font-medium">{form.filename}</span>
                  <CopyButton text={form.code} label={form.name} />
                </div>
                <pre className="p-4 text-xs overflow-x-auto max-h-96">
                  <code className="text-muted-foreground whitespace-pre">
                    {form.code}
                  </code>
                </pre>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="api" className="mt-4 space-y-4">
            {generatedCode.edgeFunctions.map((fn) => (
              <div
                key={fn.name}
                className="rounded-lg border border-border bg-secondary/30"
              >
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <div>
                    <span className="text-sm font-medium">{fn.filename}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {fn.path}
                    </span>
                  </div>
                  <CopyButton text={fn.code} label={fn.name} />
                </div>
                <pre className="p-4 text-xs overflow-x-auto max-h-96">
                  <code className="text-muted-foreground whitespace-pre">
                    {fn.code}
                  </code>
                </pre>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
