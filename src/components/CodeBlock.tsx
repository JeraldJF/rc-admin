import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock = ({ code, language = "json" }: CodeBlockProps) => {
  return (
    <Card className="bg-muted/50 border-border">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="text-xs font-mono">
            {language}
          </Badge>
        </div>
        <pre className="overflow-x-auto">
          <code className="text-sm font-mono text-foreground">{code}</code>
        </pre>
      </CardContent>
    </Card>
  );
};
