import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { firmResolver } from '../lib/firmResolver';
import {
  registerSchema,
  addressSchema,
  paymentSchema,
  type RegisterInput,
  type AddressInput,
  type PaymentInput,
} from '../schemas/user.schema';
import './forms.css';

type FormData = {
  account: RegisterInput;
  address: AddressInput;
  payment: PaymentInput;
};

/**
 * Multi-Step Form
 * Demonstrates complex workflows with step-by-step validation
 */
export function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({});

  const totalSteps = 3;

  return (
    <div className="form-container">
      <h2>Multi-Step Registration</h2>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>
      <div className="step-indicator">
        Step {step} of {totalSteps}
      </div>

      {step === 1 && (
        <AccountStep
          data={formData.account}
          onNext={(data) => {
            setFormData((prev) => ({ ...prev, account: data }));
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <AddressStep
          data={formData.address}
          onNext={(data) => {
            setFormData((prev) => ({ ...prev, address: data }));
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <PaymentStep
          data={formData.payment}
          onSubmit={(data) => {
            const finalData = { ...formData, payment: data };
            console.log('Final form data:', finalData);
            alert('Registration complete!');
            setFormData({});
            setStep(1);
          }}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
}

function AccountStep({
  data,
  onNext,
}: {
  data?: RegisterInput;
  onNext: (data: RegisterInput) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: firmResolver(registerSchema),
    defaultValues: data,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="form">
      <h3>Account Information</h3>

      <div className="form-field">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          {...register('username')}
          className={errors.username ? 'error' : ''}
        />
        {errors.username && (
          <span className="error-message">{errors.username.message}</span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && (
          <span className="error-message">{errors.email.message}</span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className={errors.password ? 'error' : ''}
        />
        {errors.password && (
          <span className="error-message">{errors.password.message}</span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          className={errors.confirmPassword ? 'error' : ''}
        />
        {errors.confirmPassword && (
          <span className="error-message">
            {errors.confirmPassword.message}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="age">Age</label>
        <input
          id="age"
          type="number"
          {...register('age')}
          className={errors.age ? 'error' : ''}
        />
        {errors.age && (
          <span className="error-message">{errors.age.message}</span>
        )}
      </div>

      <div className="form-field checkbox">
        <label>
          <input type="checkbox" {...register('acceptTerms')} />
          <span>I accept the terms and conditions</span>
        </label>
        {errors.acceptTerms && (
          <span className="error-message">{errors.acceptTerms.message}</span>
        )}
      </div>

      <button type="submit" className="submit-button">
        Next
      </button>
    </form>
  );
}

function AddressStep({
  data,
  onNext,
  onBack,
}: {
  data?: AddressInput;
  onNext: (data: AddressInput) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: firmResolver(addressSchema),
    defaultValues: data,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="form">
      <h3>Shipping Address</h3>

      <div className="form-field">
        <label htmlFor="street">Street Address</label>
        <input
          id="street"
          type="text"
          {...register('street')}
          className={errors.street ? 'error' : ''}
        />
        {errors.street && (
          <span className="error-message">{errors.street.message}</span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="city">City</label>
        <input
          id="city"
          type="text"
          {...register('city')}
          className={errors.city ? 'error' : ''}
        />
        {errors.city && (
          <span className="error-message">{errors.city.message}</span>
        )}
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="state">State</label>
          <input
            id="state"
            type="text"
            {...register('state')}
            className={errors.state ? 'error' : ''}
            placeholder="NY"
            maxLength={2}
          />
          {errors.state && (
            <span className="error-message">{errors.state.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="zipCode">ZIP Code</label>
          <input
            id="zipCode"
            type="text"
            {...register('zipCode')}
            className={errors.zipCode ? 'error' : ''}
            placeholder="12345"
          />
          {errors.zipCode && (
            <span className="error-message">{errors.zipCode.message}</span>
          )}
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="country">Country</label>
        <input
          id="country"
          type="text"
          {...register('country')}
          className={errors.country ? 'error' : ''}
          defaultValue="US"
        />
        {errors.country && (
          <span className="error-message">{errors.country.message}</span>
        )}
      </div>

      <div className="button-group">
        <button type="button" onClick={onBack} className="secondary-button">
          Back
        </button>
        <button type="submit" className="submit-button">
          Next
        </button>
      </div>
    </form>
  );
}

function PaymentStep({
  data,
  onSubmit,
  onBack,
}: {
  data?: PaymentInput;
  onSubmit: (data: PaymentInput) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaymentInput>({
    resolver: firmResolver(paymentSchema),
    defaultValues: data,
  });

  const handleFormSubmit = async (formData: PaymentInput) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="form">
      <h3>Payment Information</h3>

      <div className="form-field">
        <label htmlFor="cardNumber">Card Number</label>
        <input
          id="cardNumber"
          type="text"
          {...register('cardNumber')}
          className={errors.cardNumber ? 'error' : ''}
          placeholder="1234567812345678"
          maxLength={16}
        />
        {errors.cardNumber && (
          <span className="error-message">{errors.cardNumber.message}</span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="cardHolder">Card Holder Name</label>
        <input
          id="cardHolder"
          type="text"
          {...register('cardHolder')}
          className={errors.cardHolder ? 'error' : ''}
        />
        {errors.cardHolder && (
          <span className="error-message">{errors.cardHolder.message}</span>
        )}
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="expiryMonth">Expiry Month</label>
          <input
            id="expiryMonth"
            type="number"
            {...register('expiryMonth')}
            className={errors.expiryMonth ? 'error' : ''}
            placeholder="12"
            min={1}
            max={12}
          />
          {errors.expiryMonth && (
            <span className="error-message">{errors.expiryMonth.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="expiryYear">Expiry Year</label>
          <input
            id="expiryYear"
            type="number"
            {...register('expiryYear')}
            className={errors.expiryYear ? 'error' : ''}
            placeholder="2024"
          />
          {errors.expiryYear && (
            <span className="error-message">{errors.expiryYear.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="cvv">CVV</label>
          <input
            id="cvv"
            type="text"
            {...register('cvv')}
            className={errors.cvv ? 'error' : ''}
            placeholder="123"
            maxLength={4}
          />
          {errors.cvv && (
            <span className="error-message">{errors.cvv.message}</span>
          )}
        </div>
      </div>

      <div className="button-group">
        <button type="button" onClick={onBack} className="secondary-button">
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="submit-button"
        >
          {isSubmitting ? 'Processing...' : 'Complete Registration'}
        </button>
      </div>
    </form>
  );
}
