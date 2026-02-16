interface StatCardProps {
  name: string;
  value: string;
  unit?: string;
}

export function StatCard({ name, value, unit }: StatCardProps) {
  return (
    <div class="bg-white px-4 py-6 sm:px-6 lg:px-8">
      <p class="text-sm/6 font-medium text-gray-500">{name}</p>
      <p class="mt-2 flex items-baseline gap-x-2">
        <span class="text-4xl font-semibold tracking-tight text-gray-900">
          {value}
        </span>
        {unit ? <span class="text-sm text-gray-500">{unit}</span> : null}
      </p>
    </div>
  );
}
