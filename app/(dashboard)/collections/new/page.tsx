import { CollectionForm } from "@/components/forms/collection-form";

export const metadata = {
  title: "New Collection | SeeYou AroundTown",
  description: "Enter a new cash collection from the postcard vending machine",
};

export default function NewCollectionPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-semibold">New Collection</h1>
        <p className="text-muted-foreground">
          Enter the coin counts from your collection round.
        </p>
      </div>
      <CollectionForm />
    </div>
  );
}
