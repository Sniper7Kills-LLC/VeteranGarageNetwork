import * as React from 'react';
import PhoneInputWithCountry from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string | undefined) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, value, ...props }) => {
    return (
      <PhoneInputWithCountry
        flags={flags}
        value={value as any}
        onChange={onChange as any}
        defaultCountry="US"
        international
        withCountryCallingCode
        className={cn('flex', className)}
        numberInputProps={{
          className: cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          ),
          ...props,
        }}
        countrySelectProps={{
          className: cn(
            'mr-2 h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          ),
        }}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
