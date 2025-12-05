
import { PropertyForm } from '@/components/admin/PropertyForm';

export default function NewPropertyPage() {
  return (
    <div className="space-y-8">
        <h1 className="text-3xl font-bold">Add New Property</h1>
        <PropertyForm />
    </div>
  );
}
