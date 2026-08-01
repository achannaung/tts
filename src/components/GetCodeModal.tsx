import React, { useState } from 'react';
import { Code2, Copy, Check, X, Terminal, FileCode } from 'lucide-react';
import { SpeechParameters } from '../types';

interface GetCodeModalProps {
  parameters: SpeechParameters;
  text: string;
  isOpen: boolean;
  onClose: () => void;
}

export const GetCodeModal: React.FC<GetCodeModalProps> = ({
  parameters,
  text,
  isOpen,
  onClose,
}) => {
  const [activeLang, setActiveLang] = useState<'typescript' | 'python' | 'curl'>('typescript');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sanitizeText = (text || 'Have a wonderful day!').replace(/\n/g, ' ');

  const generateTypeScriptCode = () => {
    return `import { GoogleGenAI, Modality } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: { "User-Agent": "aistudio-build" },
  },
});

async function generateSpeech() {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{
      parts: [{
        text: "Say in a ${parameters.accent} accent with ${parameters.style} style: ${sanitizeText}"
      }]
    }],
    config: {
      responseModalities: [Modality.AUDIO],
      temperature: ${parameters.temperature},
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "${parameters.voiceName}",
          },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  console.log("Synthesized Audio Base64 length:", base64Audio?.length);
  return base64Audio;
}

generateSpeech();`;
  };

  const generatePythonCode = () => {
    return `from google import genai
from google.genai import types
import os

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

response = client.models.generate_content(
    model="gemini-3.1-flash-tts-preview",
    contents="Say in a ${parameters.accent} accent with ${parameters.style} style: ${sanitizeText}",
    config=types.GenerateContentConfig(
        response_modalities=["AUDIO"],
        temperature=${parameters.temperature},
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name="${parameters.voiceName}"
                )
            )
        ),
    ),
)

audio_data = response.candidates[0].content.parts[0].inline_data.data
print(f"Generated Audio Bytes Length: {len(audio_data)}")`;
  };

  const generateCurlCode = () => {
    return `curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=$GEMINI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contents": [{
      "parts": [{ "text": "Say in a ${parameters.accent} accent: ${sanitizeText}" }]
    }],
    "generationConfig": {
      "responseModalities": ["AUDIO"],
      "speechConfig": {
        "voiceConfig": {
          "prebuiltVoiceConfig": {
            "voiceName": "${parameters.voiceName}"
          }
        }
      }
    }
  }'`;
  };

  const currentCode =
    activeLang === 'typescript'
      ? generateTypeScriptCode()
      : activeLang === 'python'
      ? generatePythonCode()
      : generateCurlCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <Code2 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Get Code - Google AI Studio</h3>
              <p className="text-[11px] text-slate-500">
                Integration code snippet for @google/genai SDK
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-gray-200/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selectors */}
        <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveLang('typescript')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-colors ${
                activeLang === 'typescript'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 bg-gray-50'
              }`}
            >
              TypeScript (@google/genai)
            </button>
            <button
              onClick={() => setActiveLang('python')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-colors ${
                activeLang === 'python'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 bg-gray-50'
              }`}
            >
              Python (google-genai)
            </button>
            <button
              onClick={() => setActiveLang('curl')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-colors ${
                activeLang === 'curl'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 bg-gray-50'
              }`}
            >
              cURL
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Snippet</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-6 bg-slate-950 overflow-x-auto custom-scrollbar max-h-96">
          <pre className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre">
            {currentCode}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 bg-slate-50 flex justify-between items-center text-[11px] text-slate-500 font-mono">
          <span>Model: gemini-3.1-flash-tts-preview</span>
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-sans font-medium text-xs rounded-lg shadow-xs">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
