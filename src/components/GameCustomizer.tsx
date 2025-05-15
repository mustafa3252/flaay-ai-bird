import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LogIn, LogOut, Loader, Upload, Wand, Key } from 'lucide-react';

interface GameCustomizerProps {
  onUpdateImage: (type: string, imageUrl: string) => void;
  currentBackground: string;
  currentBird: string;
  currentPipeTop: string;
  currentPipeBottom: string;
}

const OPENAI_API_KEY = "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";

const GameCustomizer: React.FC<GameCustomizerProps> = ({
  onUpdateImage,
  currentBackground,
  currentBird,
  currentPipeTop,
  currentPipeBottom
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [backgroundPrompt, setBackgroundPrompt] = useState("");
  const [birdPrompt, setBirdPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [backgroundGeneratedImages, setBackgroundGeneratedImages] = useState<string[]>([]);
  const [birdGeneratedImages, setBirdGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  
  const generateImages = useCallback(async (type: string, prompt: string) => {
    if (!prompt.trim()) {
      alert("Please enter a prompt for the AI");
      return;
    }
    setLoading(type);
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "dall-e-2",
          prompt: prompt,
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
      const generatedUrls = result.data.map((item: any) => item.url);
      if (type === 'background') {
        setBackgroundGeneratedImages(generatedUrls);
      } else {
        setBirdGeneratedImages(generatedUrls);
      }
      setSelectedImageIndex(-1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate images: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    // This function is no longer used
  };

  const handleApplyGeneratedImage = useCallback((type: string) => {
    if (selectedImageIndex >= 0) {
      const images = type === 'background' ? backgroundGeneratedImages : birdGeneratedImages;
      if (images[selectedImageIndex]) {
        onUpdateImage(type, images[selectedImageIndex]);
        if (type === 'background') {
          setBackgroundGeneratedImages([]);
        } else {
          setBirdGeneratedImages([]);
        }
        setSelectedImageIndex(-1);
      }
    }
  }, [selectedImageIndex, backgroundGeneratedImages, birdGeneratedImages, onUpdateImage]);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
    };
    reader.readAsDataURL(file);
  };
  
  const handleApplyUploadedImage = () => {
    if (uploadedImage) {
      onUpdateImage('bird', uploadedImage);
      setUploadedImage(null);
    }
  };
  
  return (
    <div className="p-2 mt-4">
      <Tabs defaultValue="background">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="background">Background</TabsTrigger>
          <TabsTrigger value="bird">Bird</TabsTrigger>
        </TabsList>
        
        <TabsContent value="background" className="space-y-4">
          <div className="rounded-lg overflow-hidden mb-4 h-40 bg-black/30">
            <img 
              src={currentBackground} 
              alt="Current background" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bgPrompt">Generate with AI</Label>
            <div className="flex gap-2">
              <Input 
                id="bgPrompt" 
                placeholder="Describe your background..." 
                value={backgroundPrompt}
                onChange={(e) => setBackgroundPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.code === 'Space') {
                    e.stopPropagation();
                  }
                }}
              />
              <Button 
                onClick={() => generateImages('background', backgroundPrompt)}
                disabled={loading === 'background'}
              >
                {loading === 'background' ? <Loader className="animate-spin" /> : <Wand />}
              </Button>
            </div>
          </div>

          {backgroundGeneratedImages.length > 0 && (
            <div className="space-y-4">
              <Label>Choose an image</Label>
              <div className="grid grid-cols-3 gap-2">
                {backgroundGeneratedImages.map((url, index) => (
                  <div 
                    key={index}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-orange-500' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img 
                      src={url} 
                      alt={`Generated ${index + 1}`} 
                      className="w-full h-24 object-cover"
                    />
                  </div>
                ))}
              </div>
              <Button 
                className="w-full"
                disabled={selectedImageIndex === -1}
                onClick={() => handleApplyGeneratedImage('background')}
              >
                Apply Selected Image
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="bird" className="space-y-4">
          <div className="rounded-lg overflow-hidden mb-4 h-40 flex justify-center items-center bg-black/30">
            {uploadedImage ? (
              <img 
                src={uploadedImage} 
                alt="Uploaded bird" 
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <img 
                src={currentBird} 
                alt="Current bird" 
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="birdPrompt">Generate with AI</Label>
            <div className="flex gap-2">
              <Input 
                id="birdPrompt" 
                placeholder="Describe your bird..." 
                value={birdPrompt}
                onChange={(e) => setBirdPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.code === 'Space') {
                    e.stopPropagation();
                  }
                }}
              />
              <Button 
                onClick={() => generateImages('bird', birdPrompt)}
                disabled={loading === 'bird'}
              >
                {loading === 'bird' ? <Loader className="animate-spin" /> : <Wand />}
              </Button>
            </div>
          </div>

          {birdGeneratedImages.length > 0 && (
            <div className="space-y-4">
              <Label>Choose an image</Label>
              <div className="grid grid-cols-3 gap-2">
                {birdGeneratedImages.map((url, index) => (
                  <div 
                    key={index}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-orange-500' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img 
                      src={url} 
                      alt={`Generated ${index + 1}`} 
                      className="w-full h-24 object-cover"
                    />
                  </div>
                ))}
              </div>
              <Button 
                className="w-full"
                disabled={selectedImageIndex === -1}
                onClick={() => handleApplyGeneratedImage('bird')}
              >
                Apply Selected Image
              </Button>
            </div>
          )}
          
          <Separator />
          
          <div className="space-y-2">
            <Label>Upload your own image</Label>
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="mr-2" /> Upload Image
              </Button>
              
              {uploadedImage && (
                  <Button 
                    onClick={handleApplyUploadedImage}
                  className="w-full"
                  >
                  Use Uploaded Image
                  </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GameCustomizer;
