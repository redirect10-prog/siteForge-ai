import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BackendSpec {
  features: string[];
  hasAuth?: boolean;
  authConfig?: {
    enabled: boolean;
    providers: string[];
    requireEmailVerification: boolean;
    allowSignup: boolean;
    redirectAfterLogin: string;
    userProfileFields: string[];
    roles: string[];
  };
  database: {
    tables: Array<{
      name: string;
      description: string;
      columns: Array<{
        name: string;
        type: string;
        nullable: boolean;
        description: string;
      }>;
      hasRLS?: boolean;
      rlsPolicy?: string;
    }>;
  };
  forms: Array<{
    id: string;
    name: string;
    description: string;
    targetTable: string;
    fields: Array<{
      name: string;
      label: string;
      type: string;
      required: boolean;
      placeholder?: string;
      options?: string[];
    }>;
    submitButton: string;
    successMessage: string;
    requiresAuth?: boolean;
    hasValidation?: boolean;
    validationRules?: string[];
  }>;
  apiEndpoints: Array<{
    name: string;
    method: string;
    path: string;
    description: string;
    requiresAuth: boolean;
    hasRateLimit?: boolean;
  }>;
  emailNotifications?: Array<{
    trigger: string;
    recipient: string;
    subject: string;
    description: string;
  }>;
}

async function validateAndGetUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  
  if (claimsError || !claimsData?.claims) {
    return { user: null };
  }

  return { user: { id: claimsData.claims.sub } };
}

const backendSystemPrompt = `You are an expert full-stack developer specializing in Supabase, React, and TypeScript. Generate production-ready code based on the provided backend specification.

Your task is to generate complete, deployable code including:
1. SQL schema with proper RLS policies
2. React form components with validation
3. Supabase Edge Functions for API endpoints
4. Authentication setup if required

CRITICAL RULES:
- Generate COMPLETE, WORKING code - no placeholders or TODOs
- Use proper TypeScript types
- Include comprehensive error handling
- Add input validation for all forms
- Implement proper RLS policies based on the spec
- Use Supabase client correctly
- Make forms accessible and responsive

Return ONLY valid JSON in this exact format:
{
  "sql": "complete SQL schema with RLS policies",
  "forms": [
    {
      "id": "form_id",
      "name": "Form Name",
      "code": "complete React component code",
      "filename": "ComponentName.tsx"
    }
  ],
  "edgeFunctions": [
    {
      "name": "function-name",
      "path": "/api/path",
      "code": "complete edge function code",
      "filename": "function-name/index.ts"
    }
  ],
  "authSetup": {
    "loginComponent": "complete login form component code if auth required",
    "signupComponent": "complete signup form component code if auth required",
    "authContext": "complete auth context code if auth required"
  }
}

IMPORTANT: Return ONLY the JSON object, no markdown, no code blocks, no explanation.`;

async function generateWithAI(backend: BackendSpec): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.log("LOVABLE_API_KEY not configured, using template generation");
    return null;
  }

  const userPrompt = `Generate complete backend code for this specification:

${JSON.stringify(backend, null, 2)}

Requirements:
- SQL must include CREATE TABLE statements with proper types
- RLS policies must match the rlsPolicy field (user_owned, public_read, authenticated_only, admin_only)
- Forms must use shadcn/ui components and include validation
- Edge functions must handle CORS and errors properly
- If hasAuth is true, generate complete auth components

Generate production-ready code now.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: backendSystemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("No content in AI response");
      return null;
    }

    // Try to parse the JSON response
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      
      return JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw content:", content.substring(0, 500));
      return null;
    }
  } catch (error) {
    console.error("AI generation error:", error);
    return null;
  }
}

// Fallback template-based generation
function generateSQLSchema(backend: BackendSpec): string {
  let sql = `-- Generated Backend Schema\n-- Auto-generated - Production Ready\n\n`;
  
  for (const table of backend.database.tables) {
    sql += `-- ${table.description}\n`;
    sql += `CREATE TABLE IF NOT EXISTS public.${table.name} (\n`;
    
    const columnDefs: string[] = [];
    
    for (const col of table.columns) {
      let colType = col.type.toUpperCase();
      switch (col.type.toLowerCase()) {
        case 'uuid':
          colType = 'UUID';
          break;
        case 'text':
          colType = 'TEXT';
          break;
        case 'timestamp':
          colType = 'TIMESTAMP WITH TIME ZONE';
          break;
        case 'boolean':
          colType = 'BOOLEAN';
          break;
        case 'integer':
          colType = 'INTEGER';
          break;
        case 'jsonb':
          colType = 'JSONB';
          break;
      }
      
      let colDef = `  ${col.name} ${colType}`;
      if (col.name === 'id') {
        colDef += ' NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY';
      } else if (col.name === 'created_at') {
        colDef += ' NOT NULL DEFAULT now()';
      } else if (col.name === 'updated_at') {
        colDef += ' NOT NULL DEFAULT now()';
      } else if (col.name === 'user_id') {
        colDef += ' REFERENCES auth.users(id) ON DELETE CASCADE';
        if (!col.nullable) colDef += ' NOT NULL';
      } else if (!col.nullable) {
        colDef += ' NOT NULL';
      }
      columnDefs.push(colDef);
    }
    
    sql += columnDefs.join(',\n');
    sql += `\n);\n\n`;
    
    // Enable RLS
    if (table.hasRLS !== false) {
      sql += `-- Enable Row Level Security\n`;
      sql += `ALTER TABLE public.${table.name} ENABLE ROW LEVEL SECURITY;\n\n`;
      
      // Add RLS policies based on rlsPolicy type
      const policy = table.rlsPolicy || 'public_read';
      
      switch (policy) {
        case 'user_owned':
          sql += `-- Users can only access their own data\n`;
          sql += `CREATE POLICY "Users can view own ${table.name}" ON public.${table.name}\n`;
          sql += `  FOR SELECT USING (auth.uid() = user_id);\n\n`;
          sql += `CREATE POLICY "Users can insert own ${table.name}" ON public.${table.name}\n`;
          sql += `  FOR INSERT WITH CHECK (auth.uid() = user_id);\n\n`;
          sql += `CREATE POLICY "Users can update own ${table.name}" ON public.${table.name}\n`;
          sql += `  FOR UPDATE USING (auth.uid() = user_id);\n\n`;
          sql += `CREATE POLICY "Users can delete own ${table.name}" ON public.${table.name}\n`;
          sql += `  FOR DELETE USING (auth.uid() = user_id);\n\n`;
          break;
          
        case 'authenticated_only':
          sql += `-- Only authenticated users can access\n`;
          sql += `CREATE POLICY "Authenticated users can view ${table.name}" ON public.${table.name}\n`;
          sql += `  FOR SELECT TO authenticated USING (true);\n\n`;
          sql += `CREATE POLICY "Authenticated users can insert ${table.name}" ON public.${table.name}\n`;
          sql += `  FOR INSERT TO authenticated WITH CHECK (true);\n\n`;
          break;
          
        case 'admin_only':
          sql += `-- Only admins can access (requires user_roles table)\n`;
          sql += `CREATE POLICY "Admins can manage ${table.name}" ON public.${table.name}\n`;
          sql += `  FOR ALL USING (public.has_role(auth.uid(), 'admin'));\n\n`;
          break;
          
        default: // public_read
          sql += `-- Public read, authenticated write\n`;
          sql += `CREATE POLICY "Anyone can view ${table.name}" ON public.${table.name}\n`;
          sql += `  FOR SELECT USING (true);\n\n`;
          sql += `CREATE POLICY "Authenticated can insert ${table.name}" ON public.${table.name}\n`;
          sql += `  FOR INSERT TO authenticated WITH CHECK (true);\n\n`;
      }
    }
  }
  
  // Add updated_at trigger function if any table has updated_at
  const hasUpdatedAt = backend.database.tables.some(t => 
    t.columns.some(c => c.name === 'updated_at')
  );
  
  if (hasUpdatedAt) {
    sql += `-- Function to update updated_at timestamp\n`;
    sql += `CREATE OR REPLACE FUNCTION public.update_updated_at_column()\n`;
    sql += `RETURNS TRIGGER AS $$\n`;
    sql += `BEGIN\n`;
    sql += `  NEW.updated_at = now();\n`;
    sql += `  RETURN NEW;\n`;
    sql += `END;\n`;
    sql += `$$ LANGUAGE plpgsql SET search_path = public;\n\n`;
    
    for (const table of backend.database.tables) {
      if (table.columns.some(c => c.name === 'updated_at')) {
        sql += `CREATE TRIGGER update_${table.name}_updated_at\n`;
        sql += `  BEFORE UPDATE ON public.${table.name}\n`;
        sql += `  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();\n\n`;
      }
    }
  }
  
  return sql;
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function generateReactFormComponent(form: BackendSpec['forms'][0]): string {
  const componentName = toPascalCase(form.id) + 'Form';
  
  const formFields = form.fields.map(field => {
    const required = field.required ? 'required' : '';
    
    switch (field.type) {
      case 'textarea':
        return `      <div className="space-y-2">
        <Label htmlFor="${field.name}">${field.label}${field.required ? ' *' : ''}</Label>
        <Textarea
          id="${field.name}"
          name="${field.name}"
          placeholder="${field.placeholder || ''}"
          ${required}
          value={formData.${field.name}}
          onChange={handleChange}
          className="min-h-[100px]"
        />
      </div>`;
      
      case 'email':
        return `      <div className="space-y-2">
        <Label htmlFor="${field.name}">${field.label}${field.required ? ' *' : ''}</Label>
        <Input
          id="${field.name}"
          name="${field.name}"
          type="email"
          placeholder="${field.placeholder || ''}"
          ${required}
          value={formData.${field.name}}
          onChange={handleChange}
        />
        {errors.${field.name} && <p className="text-sm text-destructive">{errors.${field.name}}</p>}
      </div>`;
      
      case 'tel':
        return `      <div className="space-y-2">
        <Label htmlFor="${field.name}">${field.label}${field.required ? ' *' : ''}</Label>
        <Input
          id="${field.name}"
          name="${field.name}"
          type="tel"
          placeholder="${field.placeholder || ''}"
          ${required}
          value={formData.${field.name}}
          onChange={handleChange}
        />
      </div>`;
      
      case 'password':
        return `      <div className="space-y-2">
        <Label htmlFor="${field.name}">${field.label}${field.required ? ' *' : ''}</Label>
        <Input
          id="${field.name}"
          name="${field.name}"
          type="password"
          placeholder="${field.placeholder || ''}"
          ${required}
          value={formData.${field.name}}
          onChange={handleChange}
          minLength={8}
        />
        {errors.${field.name} && <p className="text-sm text-destructive">{errors.${field.name}}</p>}
      </div>`;
      
      case 'checkbox':
        return `      <div className="flex items-center space-x-2">
        <Checkbox
          id="${field.name}"
          name="${field.name}"
          checked={formData.${field.name}}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ${field.name}: checked as boolean }))}
        />
        <Label htmlFor="${field.name}">${field.label}</Label>
      </div>`;
      
      case 'select':
        const options = (field.options || []).map(opt => 
          `          <SelectItem value="${opt}">${opt}</SelectItem>`
        ).join('\n');
        return `      <div className="space-y-2">
        <Label htmlFor="${field.name}">${field.label}${field.required ? ' *' : ''}</Label>
        <Select
          value={formData.${field.name}}
          onValueChange={(value) => setFormData(prev => ({ ...prev, ${field.name}: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="${field.placeholder || 'Select...'}" />
          </SelectTrigger>
          <SelectContent>
${options}
          </SelectContent>
        </Select>
      </div>`;
      
      default:
        return `      <div className="space-y-2">
        <Label htmlFor="${field.name}">${field.label}${field.required ? ' *' : ''}</Label>
        <Input
          id="${field.name}"
          name="${field.name}"
          type="text"
          placeholder="${field.placeholder || ''}"
          ${required}
          value={formData.${field.name}}
          onChange={handleChange}
        />
      </div>`;
    }
  }).join('\n\n');

  const initialState = form.fields.reduce((acc, field) => {
    if (field.type === 'checkbox') {
      acc[field.name] = 'false';
    } else {
      acc[field.name] = "''";
    }
    return acc;
  }, {} as Record<string, string>);

  const initialStateStr = Object.entries(initialState)
    .map(([key, val]) => `    ${key}: ${val}`)
    .join(',\n');

  const errorsStateStr = form.fields
    .filter(f => f.type === 'email' || f.type === 'password')
    .map(f => `    ${f.name}: ''`)
    .join(',\n');

  const hasValidation = form.hasValidation && form.validationRules?.length;
  
  let validationCode = '';
  if (hasValidation) {
    validationCode = `
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
${form.fields.filter(f => f.required).map(f => `    if (!formData.${f.name}) {
      newErrors.${f.name} = '${f.label} is required';
    }`).join('\n')}
    
${form.fields.filter(f => f.type === 'email').map(f => `    if (formData.${f.name} && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.${f.name})) {
      newErrors.${f.name} = 'Please enter a valid email';
    }`).join('\n')}
    
${form.fields.filter(f => f.type === 'password').map(f => `    if (formData.${f.name} && formData.${f.name}.length < 8) {
      newErrors.${f.name} = 'Password must be at least 8 characters';
    }`).join('\n')}
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };`;
  }

  return `import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ${componentName}Props {
  onSuccess?: () => void;
}

export function ${componentName}({ onSuccess }: ${componentName}Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
${initialStateStr}
  });
  const [errors, setErrors] = useState<Record<string, string>>({
${errorsStateStr}
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
${validationCode}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    ${hasValidation ? `
    if (!validate()) {
      return;
    }
    ` : ''}
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("${form.targetTable}")
        .insert([formData]);

      if (error) throw error;

      toast.success("${form.successMessage}");
      setFormData({
${initialStateStr}
      });
      onSuccess?.();
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
${formFields}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "${form.submitButton}"
        )}
      </Button>
    </form>
  );
}
`;
}

function generateEdgeFunctionCode(endpoint: BackendSpec['apiEndpoints'][0], backend: BackendSpec): string {
  const isFormHandler = endpoint.path.includes('submit') || endpoint.path.includes('form');
  
  if (isFormHandler) {
    const relatedForm = backend.forms.find(f => endpoint.path.includes(f.id) || endpoint.name.includes(f.id));
    const tableName = relatedForm?.targetTable || 'submissions';
    
    return `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    
    // Validate required fields
    if (!body || Object.keys(body).length === 0) {
      return new Response(
        JSON.stringify({ error: "Request body is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format if present
    if (body.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(body.email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert into database
    const { data, error } = await supabase
      .from("${tableName}")
      .insert([{
        ...body,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save submission" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Form submitted successfully:", data.id);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
`;
  }
  
  // Generic API endpoint
  return `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    ${endpoint.requiresAuth 
      ? `const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }`
      : `const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);`}

    // ${endpoint.description}
    const body = req.method !== "GET" ? await req.json() : {};
    
    // Implement your ${endpoint.name} logic here
    console.log("${endpoint.name} called with:", body);

    return new Response(
      JSON.stringify({ success: true, message: "${endpoint.name} executed successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ${endpoint.name}:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
`;
}

function generateAuthComponents(authConfig: BackendSpec['authConfig']): any {
  if (!authConfig?.enabled) {
    return null;
  }

  const loginComponent = `import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LoginFormProps {
  onSwitchToSignup?: () => void;
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
      navigate("${authConfig.redirectAfterLogin}");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>
        ${authConfig.allowSignup ? `
        <p className="text-center text-sm text-muted-foreground mt-4">
          Don't have an account?{" "}
          <button onClick={onSwitchToSignup} className="text-primary hover:underline">
            Sign up
          </button>
        </p>` : ''}
      </CardContent>
    </Card>
  );
}`;

  const signupComponent = authConfig.allowSignup ? `import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SignupFormProps {
  onSwitchToLogin?: () => void;
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  ${authConfig.userProfileFields.includes('name') ? 'const [name, setName] = useState("");' : ''}
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ${authConfig.userProfileFields.includes('name') ? 'full_name: name,' : ''}
          }
        }
      });

      if (error) throw error;

      toast.success(${authConfig.requireEmailVerification 
        ? '"Check your email to confirm your account!"' 
        : '"Account created successfully!"'});
      onSwitchToLogin?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          ${authConfig.userProfileFields.includes('name') ? `<div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>` : ''}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <button onClick={onSwitchToLogin} className="text-primary hover:underline">
            Sign in
          </button>
        </p>
      </CardContent>
    </Card>
  );
}` : null;

  return {
    loginComponent,
    signupComponent,
    authContext: null // Using existing auth context
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication for backend code generation
    const { user } = await validateAndGetUser(req);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required for backend generation" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { backend } = await req.json() as { backend: BackendSpec };
    
    if (!backend) {
      return new Response(
        JSON.stringify({ error: "Backend specification is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${user.id} generating backend code for features:`, backend.features);
    console.log("Auth enabled:", backend.hasAuth);

    // Try AI generation first
    const aiGenerated = await generateWithAI(backend);
    
    if (aiGenerated) {
      console.log("Using AI-generated code");
      return new Response(
        JSON.stringify({ success: true, code: aiGenerated, source: "ai" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback to template generation
    console.log("Using template-based generation");
    
    const generatedCode = {
      sql: generateSQLSchema(backend),
      forms: backend.forms.map(form => ({
        id: form.id,
        name: form.name,
        code: generateReactFormComponent(form),
        filename: `${toPascalCase(form.id)}Form.tsx`
      })),
      edgeFunctions: backend.apiEndpoints.map(endpoint => ({
        name: endpoint.name,
        path: endpoint.path,
        code: generateEdgeFunctionCode(endpoint, backend),
        filename: `${endpoint.name}/index.ts`
      })),
      authSetup: generateAuthComponents(backend.authConfig)
    };

    return new Response(
      JSON.stringify({ success: true, code: generatedCode, source: "template" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating backend code:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate backend code" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
