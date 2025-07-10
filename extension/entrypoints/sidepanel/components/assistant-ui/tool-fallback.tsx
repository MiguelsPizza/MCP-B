import type { FC } from 'react';

export const ToolFallback: FC<any> = (props) => {
  const toolName = props.toolName || 'Unknown Tool';
  const args = props.args;
  const result = props.result;
  const status = props.status;

  return (
    <div className="my-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-sm font-medium">{toolName}</span>
      </div>

      {args && Object.keys(args).length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Arguments:</p>
          <pre className="text-xs bg-background/50 rounded p-2 overflow-x-auto">
            {JSON.stringify(args, null, 2)}
          </pre>
        </div>
      )}

      {result && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Result:</p>
          <div className="text-xs bg-background/50 rounded p-2 overflow-x-auto">
            {formatResult(result)}
          </div>
        </div>
      )}
    </div>
  );
};

function formatResult(result: any): React.ReactNode {
  if (result?.content?.[0]?.text) {
    const text = result.content[0].text;
    try {
      const parsed = JSON.parse(text);
      return <pre>{JSON.stringify(parsed, null, 2)}</pre>;
    } catch {
      return <div className="whitespace-pre-wrap">{text}</div>;
    }
  }

  if (typeof result === 'string') {
    try {
      const parsed = JSON.parse(result);
      return <pre>{JSON.stringify(parsed, null, 2)}</pre>;
    } catch {
      return <div className="whitespace-pre-wrap">{result}</div>;
    }
  }

  return <pre>{JSON.stringify(result, null, 2)}</pre>;
}
