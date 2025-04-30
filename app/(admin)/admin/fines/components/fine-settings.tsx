"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface FineSettingsData {
  ratePerDay: number;
  gracePeriod: number;
  maxFinePerBook: number;
  currencyCode: string;
}

export function FineSettings() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FineSettingsData>();

  // Fetch current fine settings
  React.useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/fines/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch fine settings');
        }
        const data = await response.json();
        setValue('ratePerDay', data.settings.ratePerDay);
        setValue('gracePeriod', data.settings.gracePeriod);
        setValue('maxFinePerBook', data.settings.maxFinePerBook);
        setValue('currencyCode', data.settings.currencyCode || 'USD');
      } catch (error) {
        console.error('Error fetching fine settings:', error);
        toast.error('Failed to load fine settings');
        // Set default values
        setValue('ratePerDay', 1.00);
        setValue('gracePeriod', 0);
        setValue('maxFinePerBook', 50.00);
        setValue('currencyCode', 'USD');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, [setValue]);

  // Save settings
  const onSubmit = async (data: FineSettingsData) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/fines/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Fine settings updated successfully');
    } catch (error) {
      console.error('Error saving fine settings:', error);
      toast.error('Failed to update fine settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <div>
              <CardTitle>Fine Settings</CardTitle>
              <CardDescription>Loading settings...</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fine Settings</CardTitle>
        <CardDescription>
          Configure fine rates and policies for overdue books
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ratePerDay">Fine Rate Per Day</Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  RM
                </span>
                <Input
                  id="ratePerDay"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-10"
                  placeholder="1.00"
                  {...register('ratePerDay', { 
                    required: 'Rate per day is required',
                    min: { value: 0, message: 'Rate must be non-negative' },
                    valueAsNumber: true
                  })}
                />
              </div>
              {errors.ratePerDay && (
                <p className="text-sm text-destructive">{errors.ratePerDay.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gracePeriod">Grace Period (Days)</Label>
              <Input
                id="gracePeriod"
                type="number"
                min="0"
                placeholder="0"
                {...register('gracePeriod', { 
                  required: 'Grace period is required',
                  min: { value: 0, message: 'Grace period must be non-negative' },
                  valueAsNumber: true
                })}
              />
              {errors.gracePeriod && (
                <p className="text-sm text-destructive">{errors.gracePeriod.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Number of days after due date before fines start applying
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxFinePerBook">Maximum Fine Per Book</Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  RM 
                </span>
                <Input
                  id="maxFinePerBook"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-10"
                  placeholder="50.00"
                  {...register('maxFinePerBook', { 
                    required: 'Maximum fine is required',
                    min: { value: 0, message: 'Maximum fine must be non-negative' },
                    valueAsNumber: true
                  })}
                />
              </div>
              {errors.maxFinePerBook && (
                <p className="text-sm text-destructive">{errors.maxFinePerBook.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currencyCode">Currency</Label>
              <Input
                id="currencyCode"
                placeholder="USD"
                maxLength={3}
                {...register('currencyCode', { required: 'Currency code is required' })}
              />
              {errors.currencyCode && (
                <p className="text-sm text-destructive">{errors.currencyCode.message}</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}