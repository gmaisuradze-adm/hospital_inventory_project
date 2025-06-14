import React, { useState } from 'react';
import { PlusIcon, TrashIcon, EyeIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

const FormBuilder: React.FC = () => {
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldType, setSelectedFieldType] = useState<FormField['type']>('text');

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'select', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio Button' },
    { value: 'date', label: 'Date' },
  ];

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: selectedFieldType,
      label: `New ${selectedFieldType} field`,
      required: false,
      options: selectedFieldType === 'select' || selectedFieldType === 'radio' ? ['Option 1', 'Option 2'] : undefined,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(field => field.id === id);
    if (
      (direction === 'up' && index > 0) ||
      (direction === 'down' && index < fields.length - 1)
    ) {
      const newFields = [...fields];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
      setFields(newFields);
    }
  };

  const renderFieldPreview = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder || field.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            disabled
          />
        );
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder || field.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24 resize-none"
            disabled
          />
        );
      case 'select':
        return (
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled>
            <option>Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input type="checkbox" className="rounded" disabled />
            <span>{field.label}</span>
          </div>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input type="radio" name={field.id} disabled />
                <span>{option}</span>
              </div>
            ))}
          </div>
        );
      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            disabled
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
          <p className="text-gray-600">Create dynamic forms with custom fields</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <EyeIcon className="h-5 w-5" />
            Preview
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Save Form
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Settings */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Form Settings</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter form name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                placeholder="Enter form description"
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-3">Add Field</h4>
              <div className="space-y-3">
                <select
                  value={selectedFieldType}
                  onChange={(e) => setSelectedFieldType(e.target.value as FormField['type'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {fieldTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addField}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Field
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Builder */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Form Preview</h3>
              <span className="text-sm text-gray-500">{fields.length} fields</span>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No fields added yet. Add fields from the sidebar to start building your form.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="relative border border-gray-200 rounded-lg p-4 hover:border-blue-300 group">
                    <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveField(field.id, 'up')}
                          disabled={index === 0}
                          className="p-1 bg-white border border-gray-300 rounded text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveField(field.id, 'down')}
                          disabled={index === fields.length - 1}
                          className="p-1 bg-white border border-gray-300 rounded text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeField(field.id)}
                          className="p-1 bg-white border border-gray-300 rounded text-red-400 hover:text-red-600"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="font-medium text-gray-900 bg-transparent border-none p-0 focus:ring-0"
                        />
                        {field.required && <span className="text-red-500">*</span>}
                        <button
                          onClick={() => updateField(field.id, { required: !field.required })}
                          className="ml-auto text-xs text-gray-500 hover:text-gray-700"
                        >
                          {field.required ? 'Required' : 'Optional'}
                        </button>
                      </div>
                      {renderFieldPreview(field)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
