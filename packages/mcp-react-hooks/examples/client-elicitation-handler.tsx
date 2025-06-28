import { useEffect, useState } from 'react';
import { McpClientProvider, useMcpClient } from '@mcp-b/mcp-react-hooks';
import { TabClientTransport } from '@mcp-b/transports';
import { ElicitRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Example showing how to handle elicitation requests on the client side
function ClientWithElicitationHandler() {
  const transport = new TabClientTransport('mcp', { clientInstanceId: 'elicitation-client' });

  return (
    <McpClientProvider client={client} transport={transport}>
      <ElicitationHandler />
    </McpClientProvider>
  );
}

function ElicitationHandler() {
  const { client, isConnected } = useMcpClient();
  const [elicitationRequest, setElicitationRequest] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isConnected) return;

    // Set up handler for elicitation requests from the server
    client.setRequestHandler(ElicitRequestSchema, async (request) => {
      // In a real app, you would show a proper UI modal/dialog
      return new Promise((resolve) => {
        setElicitationRequest({
          request,
          resolve,
        });
        setShowModal(true);
      });
    });

    return () => {
      // Clean up handler
      client.removeRequestHandler('elicitation/create');
    };
  }, [client, isConnected]);

  const handleElicitationResponse = (action: 'accept' | 'reject' | 'cancel', data?: any) => {
    if (!elicitationRequest) return;

    elicitationRequest.resolve({
      action,
      ...(action === 'accept' && data ? { content: data } : {}),
    });

    setElicitationRequest(null);
    setShowModal(false);
  };

  return (
    <>
      <div>
        <h2>Client with Elicitation Handler</h2>
        <p>Status: {isConnected ? 'Connected' : 'Connecting...'}</p>
      </div>

      {/* Simple modal for elicitation requests */}
      {showModal && elicitationRequest && (
        <ElicitationModal
          message={elicitationRequest.request.params.message}
          schema={elicitationRequest.request.params.requestedSchema}
          onAccept={(data) => handleElicitationResponse('accept', data)}
          onReject={() => handleElicitationResponse('reject')}
          onCancel={() => handleElicitationResponse('cancel')}
        />
      )}
    </>
  );
}

// Simple modal component for elicitation
function ElicitationModal({
  message,
  schema,
  onAccept,
  onReject,
  onCancel,
}: {
  message: string;
  schema: any;
  onAccept: (data: any) => void;
  onReject: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAccept(formData);
  };

  // Render form based on JSON schema
  const renderFormFields = () => {
    if (schema.type !== 'object' || !schema.properties) {
      return <div>Unsupported schema type</div>;
    }

    return Object.entries(schema.properties).map(([key, prop]: [string, any]) => {
      const isRequired = schema.required?.includes(key);

      return (
        <div key={key} style={{ marginBottom: '10px' }}>
          <label>
            {prop.title || key}
            {isRequired && ' *'}
            <br />
            {prop.description && <small style={{ color: '#666' }}>{prop.description}</small>}
            <br />
            {renderInput(key, prop)}
          </label>
        </div>
      );
    });
  };

  const renderInput = (key: string, prop: any) => {
    switch (prop.type) {
      case 'string':
        if (prop.enum) {
          return (
            <select
              value={formData[key] || prop.default || ''}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              style={{ width: '100%', padding: '5px' }}
            >
              <option value="">Select...</option>
              {prop.enum.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        }
        return (
          <input
            type="text"
            value={formData[key] || prop.default || ''}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            style={{ width: '100%', padding: '5px' }}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={formData[key] || prop.default || ''}
            onChange={(e) => setFormData({ ...formData, [key]: Number(e.target.value) })}
            min={prop.minimum}
            max={prop.maximum}
            style={{ width: '100%', padding: '5px' }}
          />
        );

      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={formData[key] ?? prop.default ?? false}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
          />
        );

      default:
        return <div>Unsupported field type: {prop.type}</div>;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '90%',
        }}
      >
        <h3>Server Request</h3>
        <p>{message}</p>

        <form onSubmit={handleSubmit}>
          {renderFormFields()}

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button type="submit">Accept</button>
            <button type="button" onClick={onReject}>
              Reject
            </button>
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClientWithElicitationHandler;
