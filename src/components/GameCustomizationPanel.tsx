import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface GameCustomizationPanelProps {
  onUpdateBackground: (imageUrl: string) => void;
  onUpdateBird: (imageUrl: string) => void;
}

const OPENAI_API_KEY = "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";

const GameCustomizationPanel: React.FC<GameCustomizationPanelProps> = ({
  onUpdateBackground,
  onUpdateBird,
}) => {
  const [showBackgroundPrompt, setShowBackgroundPrompt] = useState(false);
  const [backgroundPrompt, setBackgroundPrompt] = useState('');
  const [showBirdUpload, setShowBirdUpload] = useState(false);
  const [birdPrompt, setBirdPrompt] = useState('');
  const [birdFile, setBirdFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  // Generate background image using OpenAI API
  const handleBackgroundPromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('background');
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: backgroundPrompt,
          n: 1,
          size: "1024x1024"
        })
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${errorData}`);
      }
      const result = await response.json();
      if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
        throw new Error('No images generated in the response');
      }
      const imageUrl = result.data[0].url;
      onUpdateBackground(imageUrl);
      setShowBackgroundPrompt(false);
      setBackgroundPrompt('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate image: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  // Handle bird file change
  const handleBirdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBirdFile(e.target.files[0]);
    }
  };

  // Handle bird upload/modify
  const handleBirdUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (birdFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onUpdateBird(result);
        setShowBirdUpload(false);
        setBirdPrompt('');
        setBirdFile(null);
      };
      reader.readAsDataURL(birdFile);
      return;
    }
    if (birdPrompt.trim()) {
      setLoading('bird');
      try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: birdPrompt,
            n: 1,
            size: "1024x1024"
          })
        });
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`OpenAI API error: ${errorData}`);
        }
        const result = await response.json();
        if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
          throw new Error('No images generated in the response');
        }
        const imageUrl = result.data[0].url;
        onUpdateBird(imageUrl);
        setShowBirdUpload(false);
        setBirdPrompt('');
        setBirdFile(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Failed to generate image: ${errorMessage}`);
      } finally {
        setLoading(null);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      <ul className="flex flex-col gap-4">
        <li>
          <Button onClick={() => setShowBackgroundPrompt(true)} className="w-full">
            Change Background
          </Button>
        </li>
        <li>
          <Button onClick={() => setShowBirdUpload(true)} className="w-full">
            Change Bird
          </Button>
        </li>
      </ul>

      {/* Background prompt modal */}
      {showBackgroundPrompt && (
        <form
          onSubmit={handleBackgroundPromptSubmit}
          className="mt-6 flex flex-col gap-2"
        >
          <label className="text-white">Enter a prompt for your background:</label>
          <input
            type="text"
            value={backgroundPrompt}
            onChange={e => setBackgroundPrompt(e.target.value)}
            className="p-2 rounded"
          />
          <Button type="submit" className="mt-2" disabled={loading === 'background'}>
            {loading === 'background' ? 'Generating...' : 'Generate'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setShowBackgroundPrompt(false)}>
            Cancel
          </Button>
        </form>
      )}

      {/* Bird upload modal */}
      {showBirdUpload && (
        <form
          onSubmit={handleBirdUpload}
          className="mt-6 flex flex-col gap-2"
        >
          <label className="text-white">Upload a bird image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleBirdFileChange}
            className="p-2 rounded"
          />
          <label className="text-white mt-2">Or enter a prompt to generate/modify:</label>
          <input
            type="text"
            value={birdPrompt}
            onChange={e => setBirdPrompt(e.target.value)}
            className="p-2 rounded"
          />
          <Button type="submit" className="mt-2" disabled={loading === 'bird'}>
            {loading === 'bird' ? 'Uploading/Generating...' : 'Upload/Generate'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setShowBirdUpload(false)}>
            Cancel
          </Button>
        </form>
      )}
    </div>
  );
};

export default GameCustomizationPanel; 