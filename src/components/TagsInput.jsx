// src/components/TagsInput.jsx
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from 'lucide-react';

/**
 * A custom tags input component based on the user's screenshot
 *
 *
 * @param {Object} props
 * @param {string[]} props.tags - The array of tags
 * @param {Function} props.setTags - The function to update the tags array
 */
export default function TagsInput({ tags, setTags }) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    // Check for "Enter" or "Comma"
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); // Stop the form from submitting
      addTag();
    }
  };

  const addTag = () => {
    const newTag = inputValue.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setInputValue(''); // Clear the input
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <Input
        id="tags-input"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a category or tag and press Enter..."
      />
      <p className="text-sm text-muted-foreground">
        Press Enter or add a comma after each tag.
      </p>
      <div className="flex flex-wrap gap-2 rounded-md border p-2 min-h-[40px]">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {tag}
            <button
              type="button"
              className="rounded-full hover:bg-muted-foreground/20 p-0.5"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}