import { FlashMessage } from "../ui/FlashMessage.js";

interface SetupPageProps {
  token: string;
  error?: string;
  expired?: boolean;
}

export function SetupPage({ token, error, expired }: SetupPageProps) {
  return (
    <html lang="en" class="h-full bg-white">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Set Up Your Account - FAIR-Aware</title>
        <link rel="stylesheet" href="/css/admin.css" />
      </head>
      <body class="h-full">
        <div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
          <div class="sm:mx-auto sm:w-full sm:max-w-sm">
            <img
              alt="FAIR-Aware"
              src="/images/logos/fairaware.png"
              class="mx-auto h-10 w-auto"
            />
            <h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
              Set up your account
            </h2>
          </div>

          <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            {expired ? (
              <div>
                <div class="mb-6">
                  <FlashMessage
                    message="This invitation link has expired. Please contact your administrator to receive a new invitation."
                    variant="error"
                  />
                </div>
                <p class="text-center text-sm text-gray-500">
                  <a
                    href="/admin/login"
                    class="font-semibold text-primary-600 hover:text-primary-500"
                  >
                    Back to sign in
                  </a>
                </p>
              </div>
            ) : (
              <div>
                {error && (
                  <div class="mb-6">
                    <FlashMessage message={error} variant="error" />
                  </div>
                )}

                <form action="/admin/setup" method="post" class="space-y-6">
                  <input type="hidden" name="token" value={token} />

                  <div>
                    <label
                      for="password"
                      class="block text-sm/6 font-medium text-gray-900"
                    >
                      Password
                    </label>
                    <div class="mt-2">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        autocomplete="new-password"
                        class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      for="confirm_password"
                      class="block text-sm/6 font-medium text-gray-900"
                    >
                      Confirm Password
                    </label>
                    <div class="mt-2">
                      <input
                        id="confirm_password"
                        name="confirm_password"
                        type="password"
                        required
                        minLength={8}
                        autocomplete="new-password"
                        class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      class="flex w-full justify-center rounded-md bg-primary-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                    >
                      Set password
                    </button>
                  </div>
                </form>

                <p class="mt-10 text-center text-sm/6 text-gray-500">
                  Already have an account?{" "}
                  <a
                    href="/admin/login"
                    class="font-semibold text-primary-600 hover:text-primary-500"
                  >
                    Sign in
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
