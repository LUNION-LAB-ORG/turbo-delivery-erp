'use client';

import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/ui/form-ui/submit-button';

import { loginUser } from '@/src/actions/users.actions';
import { toast } from 'react-toastify';
import { _loginSchema } from '@/src/schemas/users.schema';
import { useRouter } from 'next/navigation';
import { IconLock, IconUser } from '@tabler/icons-react';
import { FormChangePassword } from './form-change-password';

export function FormLogin() {
  const router = useRouter();
  const [state, formAction] = useFormState(
    async (_: any, formData: FormData) => {
      const result = await loginUser(formData);
      if (result.status === 'error') {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        router.push('/');
      }
      return result;
    },
    {
      data: {
        changePassword: true,
      },
      message: '',
      errors: {},
      status: 'idle',
      code: undefined,
    },
  );

  return (
    <>
      {state.data && !state.data?.changePassword && <FormChangePassword userName={state.data?.username} />}
      <form className="space-y-5 dark:text-white" action={formAction}>
        <div>
          <label htmlFor="username">Nom d&apos;utilisateur</label>
          <div className="relative">
            <input id="username" name="username" type="text" required placeholder="Username" className="form-input ps-10" />
            <span className="absolute start-4 top-1/2 -translate-y-1/2">
              <IconUser />
            </span>
          </div>
        </div>
        <div>
          <label htmlFor="Password">Password</label>
          <div className="relative text-black">
            <input id="Password" name="password" type="password" required placeholder="Enter Password" className="form-input ps-10 placeholder:text-gray-500" />
            <span className="absolute start-4 top-1/2 -translate-y-1/2">
              <IconLock />
            </span>
          </div>
        </div>
        <SubmitButton>Je me connecte</SubmitButton>
      </form>
    </>
  );
}
