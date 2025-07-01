import type React from 'react';
import { useAssistantForm } from '@assistant-ui/react-hook-form';
import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
import { Controller, type ControllerRenderProps } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

type ToolInteractiveFormProps = {
  tool: McpTool;
  args: Record<string, any>;
  onSubmit: (formData: Record<string, any>) => void;
};

const getPropertyComponent = (
  type: string | undefined,
  field: ControllerRenderProps<Record<string, any>, string>
) => {
  switch (type) {
    case 'string':
      return (
        <Input
          type="text"
          {...field}
          value={field.value ?? ''}
          onChange={(e) => field.onChange(e.target.value)}
          className="font-mono"
        />
      );
    case 'number':
    case 'integer':
      return (
        <Input
          type="number"
          {...field}
          value={field.value ?? ''}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            field.onChange(isNaN(val) ? '' : val);
          }}
          className="font-mono"
        />
      );
    case 'boolean':
      return (
        <Checkbox
          {...field}
          checked={!!field.value}
          onCheckedChange={field.onChange}
          value={undefined}
        />
      );
    default:
      return (
        <Textarea
          {...field}
          value={
            typeof field.value === 'string'
              ? field.value
              : (JSON.stringify(field.value, null, 2) ?? '')
          }
          onChange={(e) => field.onChange(e.target.value)}
          className="font-mono"
          rows={3}
        />
      );
  }
};

export const ToolInteractiveForm: React.FC<ToolInteractiveFormProps> = ({
  tool,
  args,
  onSubmit,
}) => {
  const { control, handleSubmit } = useAssistantForm({
    assistant: {
      tools: {
        submit_form: {
          render: ({ toolName, args, status, argsText }) => {
            console.log(toolName, args, status, argsText);
            return (
              <div>
                <Input type="text" value={argsText} />
              </div>
            );
          },
        },
        set_form_field: {
          render: ({ toolName, args, status, argsText }) => {
            console.log(toolName, args, status, argsText);
            return (
              <div>
                <Input type="text" value={argsText} />
              </div>
            );
          },
        },
      },
    },

    defaultValues: args,
  });

  const properties = tool.inputSchema?.properties;

  return (
    <Card className="my-2 shadow-lg border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-base font-semibold">
          <span>User Input Required: {tool.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please confirm or edit the arguments for this tool.
          </p>
          {!properties || Object.keys(properties).length === 0 ? (
            <p className="text-sm">This tool requires no arguments.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(properties).map(([key, prop]) => {
                const schema = prop as any;
                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="font-semibold">
                      {schema.title || key}
                    </Label>
                    {schema.description && (
                      <p className="text-xs text-muted-foreground">{schema.description}</p>
                    )}
                    <Controller
                      name={key}
                      control={control}
                      render={({ field }) => getPropertyComponent(schema.type, field)}
                    />
                  </div>
                );
              })}
            </div>
          )}
          <Button type="submit" className="w-full">
            Confirm and Execute
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
