"use client";

import { categories } from "@/data/categories";

interface NewsCategoriesProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export default function NewsCategories({
  selectedCategory,
  setSelectedCategory,
}: NewsCategoriesProps) {
  return (
    <div className="p-4">
      <ul className="space-y-1">
        {categories.map((category) => (
          <li
            key={category}
            className={`category-item ${
              selectedCategory === category ? "active" : ""
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </li>
        ))}
      </ul>
    </div>
  );
}
