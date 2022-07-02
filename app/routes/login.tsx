import type { ActionFunction, LinksFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useActionData, useSearchParams } from '@remix-run/react';
import invariant from 'tiny-invariant';
import loginStylesUrl from '~/styles/login.css';
import { db } from '~/utils/db.server';
import { createUserSession, login } from '~/utils/session.server';

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: loginStylesUrl }];
};

interface ActionData {
  formError?: string;
  fieldErrors?: {
    username: string | undefined;
    password: string | undefined;
  };
  fields?: {
    username: string;
    password: string;
    loginType: string;
  };
}

function validatePasswordMinLen(password: unknown) {
  if (typeof password !== 'string' || password.length < 6) {
    return 'Password length must be 6 characters and above';
  }
}

function validateNameMinLen(username: unknown) {
  if (typeof username !== 'string' || username.length < 3) {
    return 'Username length must be 3 characters and above';
  }
}

function validateUrl(url: any) {
  console.log({ url });
  let urls = ['/jokes', '/', 'http://localhost:3000', '/jokes/new'];
  if (urls.includes(url)) {
    return url;
  }
  return '/jokes';
}

const badRequest = (data: ActionData, statusCode: number = 422) => {
  return json(data, { status: statusCode });
};

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();

  const username: string | null = body.get('username') as string | null;
  const password: string | null = body.get('password') as string | null;
  const loginType: string | null = body.get('loginType') as string | null;
  const redirectTo = validateUrl(body.get('redirectTo') || '/jokes');

  console.log({ redirectTo });
  console.log({ redirectTo: body.get('redirectTo') });

  invariant(username, 'Form not submitted correctly.');
  invariant(password, 'Form not submitted correctly.');
  invariant(loginType, 'Form not submitted correctly.');

  if (
    typeof loginType !== 'string' ||
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    typeof redirectTo !== 'string'
  ) {
    return badRequest({
      formError: `Form not submitted correctly.`,
    });
  }

  /// Other validations
  const fields = { username, password, loginType };
  const fieldMinLenErrors = {
    username: validateNameMinLen(username),
    password: validatePasswordMinLen(password),
  };

  if (Object.values(fieldMinLenErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors: fieldMinLenErrors,
    });
  }

  /// create a new field
  switch (loginType) {
    case 'login': {
      // login to get the user
      const tryLogin = await login(username, password);

      // if there's no user, return the fields and a formError
      if (!tryLogin) {
        return badRequest(
          { fields, formError: 'Username/Password combination is incorrect' },
          400
        );
      }
      const user = tryLogin;

      return createUserSession(user.id, redirectTo);

      // if there is a user, create their session and redirect to /jokes
      // return badRequest({
      //   fields,
      //   formError: 'Not implemented',
      // });
    }

    case 'register': {
      const userExists = await db.user.findFirst({
        where: { username },
      });
      if (userExists) {
        return badRequest({
          fields,
          formError: `User with username ${username} already exists`,
        });
      }

      // create the user
      // create their session and redirect to /jokes
      return badRequest({
        fields,
        formError: 'Not implemented',
      });
    }

    default: {
      return badRequest({
        fields,
        formError: `Login type invalid`,
      });
    }
  }
};

export default function LoginRoute() {
  const actionData = useActionData<ActionData>();
  const [searchParams] = useSearchParams();

  return (
    <div className="container">
      <div className="content" data-light="">
        <h1>Login</h1>

        <form method="post">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get('redirectTo') ?? undefined}
          />

          <fieldset>
            <legend className="sr-only">Login or Register?</legend>

            <label>
              <input
                type="radio"
                name="loginType"
                value="login"
                defaultChecked={
                  !actionData?.fields?.loginType ||
                  actionData?.fields?.loginType === 'login'
                }
              />{' '}
              Login
            </label>

            <label>
              <input
                type="radio"
                name="loginType"
                value="register"
                defaultChecked={actionData?.fields?.loginType === 'register'}
              />{' '}
              Register
            </label>
          </fieldset>

          <div>
            <label htmlFor="username-input">Username</label>
            <input
              type="text"
              id="username-input"
              name="username"
              defaultValue={actionData?.fields?.username}
              aria-invalid={Boolean(actionData?.fieldErrors?.username)}
              aria-errormessage={
                actionData?.fieldErrors?.username ? 'username-error' : undefined
              }
            />

            {actionData?.fieldErrors?.username ? (
              <p
                className="form-validation-error"
                role="alert"
                id="username-error"
              >
                {actionData.fieldErrors.username}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              name="password"
              defaultValue={actionData?.fields?.password}
              type="password"
              aria-invalid={
                Boolean(actionData?.fieldErrors?.password) || undefined
              }
              aria-errormessage={
                actionData?.fieldErrors?.password ? 'password-error' : undefined
              }
            />

            {actionData?.fieldErrors?.password ? (
              <p
                className="form-validation-error"
                role="alert"
                id="password-error"
              >
                {actionData.fieldErrors.password}
              </p>
            ) : null}
          </div>

          <div id="form-error-message">
            {actionData?.formError ? (
              <p className="form-validation-error" role="alert">
                {actionData.formError}
              </p>
            ) : null}
          </div>

          <button type="submit" className="button">
            Submit
          </button>
        </form>
      </div>

      <div className="links">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/jokes">Jokes</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
