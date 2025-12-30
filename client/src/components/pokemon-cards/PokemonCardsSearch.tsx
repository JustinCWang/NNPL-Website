"use client";
/*
  Pokemon Cards search form.
  - Set selection dropdown + submit button
  - Kept as a separate component so the route page stays small and readable
*/

export type PokemonSetOption = { value: string; label: string };

type PokemonCardsSearchProps = {
  setID: string;
  onSetIDChange: (setID: string) => void;
  availableSets: PokemonSetOption[];
  onSubmit: () => void;
  isSubmitting: boolean;
};

export default function PokemonCardsSearch({
  setID,
  onSetIDChange,
  availableSets,
  onSubmit,
  isSubmitting,
}: PokemonCardsSearchProps) {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label htmlFor="setID" className="block text-sm font-medium text-gray-700 mb-2">
            Select Set
          </label>
          <select
            id="setID"
            value={setID}
            onChange={(e) => onSetIDChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">-- Select a Pokemon Set --</option>
            {availableSets.map((set) => (
              <option key={set.value} value={set.value}>
                {set.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onSubmit}
          disabled={isSubmitting || !setID}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {isSubmitting ? "Loading..." : "Load Cards"}
        </button>
      </div>
    </div>
  );
}


