interface InputProps {
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autocomplete?: string;
  id?: string;
}

export function Input({
  name,
  type = "text",
  placeholder,
  required = false,
  autocomplete,
  id,
}: InputProps) {
  return (
    <input
      id={id ?? name}
      name={name}
      type={type}
      placeholder={placeholder}
      required={required}
      autocomplete={autocomplete}
      class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-primary-600 sm:text-sm/6"
    />
  );
}
