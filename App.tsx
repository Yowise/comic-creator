
import React, { useState, useCallback } from 'react';
import PromptInput from './components/PromptInput';
import ComicDisplay from './components/ComicDisplay';
import Loader from './components/Loader';
import ErrorDisplay from './components/ErrorDisplay';
import { checkContentSafety, generateComicScript, generatePanelImage } from './services/geminiService';
import type { ComicPanelData } from './types';

const App: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('A detective cat solves the mystery of the missing tuna in a city of robots.');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [generatingStep, setGeneratingStep] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [comicPanels, setComicPanels] = useState<ComicPanelData[] | null>(null);

    const handleReset = () => {
        setPrompt('A detective cat solves the mystery of the missing tuna in a city of robots.');
        setIsLoading(false);
        setGeneratingStep('');
        setError(null);
        setComicPanels(null);
    };

    const generateComic = useCallback(async () => {
        if (!prompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setComicPanels(null);

        try {
            setGeneratingStep('Analyzing story idea for safety...');
            const isSafe = await checkContentSafety(prompt);
            if (!isSafe) {
                throw new Error("Your prompt was flagged for potentially unsafe content. Please try a different story.");
            }

            setGeneratingStep('Writing a dramatic script...');
            const { characters, script } = await generateComicScript(prompt);
            setComicPanels(script); // Set panels to show placeholders immediately

            setGeneratingStep('Hiring an AI artist to draw the panels...');
            
            // Generate images in parallel. Let Promise.all fail fast on the first error
            // to display a specific error message to the user.
            const imagePromises = script.map(panel => 
                generatePanelImage(panel.description, characters)
            );
            const imageUrls = await Promise.all(imagePromises);

            // This code will only be reached if all images are generated successfully.
            const finalPanels = script.map((panel, index) => ({
                ...panel,
                imageUrl: imageUrls[index],
            }));

            setComicPanels(finalPanels);

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            console.error(errorMessage);
            setError(errorMessage);
            setComicPanels(null); // Clear partial results on error
        } finally {
            setIsLoading(false);
            setGeneratingStep('');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prompt]);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
            <div className="container mx-auto max-w-7xl">
                <header className="text-center mb-12">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-teal-400">
                            Comic Creator
                        </span>
                    </h1>
                    <p className="mt-4 text-lg text-gray-400">Turn your ideas into a 4-panel mini-comic with AI</p>
                </header>
                
                <main className="flex flex-col items-center justify-center min-h-[50vh]">
                    {error && <ErrorDisplay message={error} />}

                    {isLoading && <Loader message={generatingStep} />}

                    {!isLoading && !comicPanels && (
                        <PromptInput
                            prompt={prompt}
                            setPrompt={setPrompt}
                            onSubmit={generateComic}
                            isLoading={isLoading}
                        />
                    )}
                    
                    {!isLoading && comicPanels && (
                         <ComicDisplay panels={comicPanels} onReset={handleReset} />
                    )}
                </main>

                <footer className="text-center mt-16 text-gray-600 text-sm">
                    <p>Powered by Gemini & Imagen. Illustrations by AI.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;
