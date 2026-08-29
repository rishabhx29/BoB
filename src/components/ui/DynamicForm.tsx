import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Switch, TextInput } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { COLORS, SIZES, SHADOWS } from '@/constants/theme';
import { FieldDefinition } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface DynamicFormProps {
  fields: FieldDefinition[];
  onSubmit: (data: Record<string, any>) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

const generateSchema = (fields: FieldDefinition[]) => {
  const schemaShape: any = {};
  fields.forEach(f => {
    let fieldSchema: z.ZodTypeAny;
    switch(f.type) {
      case 'text':
      case 'singleselect':
        fieldSchema = z.string();
        if (f.required) {
          fieldSchema = (fieldSchema as z.ZodString).min(1, 'Required');
        } else {
          fieldSchema = fieldSchema.optional();
        }
        break;
      case 'number':
        fieldSchema = z.coerce.number();
        if (!f.required) fieldSchema = fieldSchema.optional();
        break;
      case 'multiselect':
        fieldSchema = z.array(z.string());
        if (f.required) {
          fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).min(1, 'Select at least one');
        } else {
          fieldSchema = fieldSchema.optional().default([]);
        }
        break;
      case 'toggle':
        fieldSchema = z.boolean();
        if (!f.required) fieldSchema = fieldSchema.optional().default(false);
        break;
      case 'stars':
      case 'emoji-scale':
        fieldSchema = z.number().min(1, 'Required').max(5);
        if (!f.required) fieldSchema = fieldSchema.optional();
        break;
      default:
        fieldSchema = z.any();
    }
    schemaShape[f.id] = fieldSchema;
  });
  return z.object(schemaShape);
};

export function DynamicForm({ fields, onSubmit, submitLabel = 'Submit', isSubmitting = false }: DynamicFormProps) {
  const schema = useMemo(() => generateSchema(fields), [fields]);
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: fields.reduce((acc, f) => {
      if (f.type === 'multiselect') acc[f.id] = [];
      else if (f.type === 'toggle') acc[f.id] = false;
      return acc;
    }, {} as any)
  });

  const renderField = (field: FieldDefinition, onChange: any, value: any) => {
    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <TextInput
            style={styles.textInput}
            value={value !== undefined && value !== null ? String(value) : ''}
            onChangeText={onChange}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            placeholderTextColor={COLORS.textSecondary}
            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
          />
        );
      case 'multiselect':
        return (
          <View style={styles.chipContainer}>
            {field.options?.map(opt => {
              const isSelected = Array.isArray(value) && value.includes(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => {
                    const current = Array.isArray(value) ? value : [];
                    if (isSelected) {
                      onChange(current.filter(i => i !== opt));
                    } else {
                      onChange([...current, opt]);
                    }
                  }}
                >
                  <Text style={isSelected ? styles.chipTextActive : undefined}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case 'singleselect':
        return (
          <View style={styles.chipContainer}>
            {field.options?.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, value === opt && styles.chipActive]}
                onPress={() => onChange(opt)}
              >
                <Text style={value === opt ? styles.chipTextActive : undefined}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case 'toggle':
        return (
          <Switch
            value={!!value}
            onValueChange={onChange}
            trackColor={{ false: COLORS.surfaceDark, true: COLORS.brandPrimary }}
          />
        );
      case 'stars':
      case 'emoji-scale':
        const max = 5;
        const emojis = field.type === 'emoji-scale' ? ['😴', '😐', '🙂', '😃', '😤'] : ['⭐', '⭐', '⭐', '⭐', '⭐'];
        return (
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map(num => (
              <TouchableOpacity
                key={num}
                style={[styles.ratingBtn, value === num && styles.ratingBtnActive]}
                onPress={() => onChange(num)}
              >
                <Text style={{ fontSize: field.type === 'emoji-scale' ? 32 : 24, opacity: value === num ? 1 : 0.3 }}>
                  {emojis[num - 1]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.formContainer}>
      {fields.map(field => (
        <View key={field.id} style={styles.fieldWrapper}>
          <View style={styles.labelRow}>
            <Text variant="headingMd" style={styles.label}>
              {field.label} {field.required && <Text color={COLORS.danger}>*</Text>}
            </Text>
            {field.unit && <Text variant="caption" color={COLORS.textSecondary}>({field.unit})</Text>}
          </View>
          
          <Controller
            control={control}
            name={field.id}
            render={({ field: { onChange, value } }) => (
              <View style={[
                styles.inputWrapper, 
                field.type === 'toggle' && styles.toggleWrapper
              ]}>
                {renderField(field, onChange, value)}
              </View>
            )}
          />
          
          {errors[field.id] && (
            <Text variant="caption" color={COLORS.danger} style={styles.errorText}>
              {errors[field.id]?.message as string}
            </Text>
          )}
        </View>
      ))}

      <View style={styles.submitWrapper}>
        <Button 
          label={isSubmitting ? "Submitting..." : submitLabel} 
          onPress={handleSubmit(onSubmit)} 
          disabled={isSubmitting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
  },
  fieldWrapper: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    marginRight: 8,
  },
  inputWrapper: {
    width: '100%',
  },
  toggleWrapper: {
    alignItems: 'flex-start',
  },
  textInput: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 12,
    padding: 16,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)', // Inset look
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.surfaceDark,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  chipActive: {
    backgroundColor: COLORS.brandPrimary,
    borderColor: COLORS.brandPrimary,
    ...SHADOWS.softElevation,
  },
  chipTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceDark,
    padding: 8,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  ratingBtn: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  ratingBtnActive: {
    backgroundColor: COLORS.surfaceBase,
    ...SHADOWS.softElevation,
  },
  errorText: {
    marginTop: 8,
  },
  submitWrapper: {
    marginTop: 16,
    marginBottom: 40,
  }
});
