import React, { useState, useRef } from 'react';
import { SydDesign } from '../src/styles/SydDesignSystem';
import { StyledCard } from './ui/StyledCard';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { AlertIcon } from './icons/AlertIcon';
import { ExcelIcon } from './icons/ExcelIcon';
import { FactoryIcon } from './icons/FactoryIcon';
import { ZapierIcon } from './icons/ZapierIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface WizardStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

interface DetectedSystem {
  type: 'excel' | 'sap' | 'folder' | 'database';
  name: string;
  location: string;
  confidence: number;
  icon: React.ReactNode;
}

interface MCPWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (config: any) => void;
}

const MCPWizard: React.FC<MCPWizardProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<DetectedSystem | null>(null);
  const [generatedConfig, setGeneratedConfig] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps: WizardStep[] = [
    { id: 1, title: 'Auto-Detection', description: 'Rileva sistemi disponibili', completed: false },
    { id: 2, title: 'Selezione', description: 'Scegli cosa connettere', completed: false },
    { id: 3, title: 'Test', description: 'Verifica connessione', completed: false },
    { id: 4, title: 'Configurazione', description: 'Genera codice pronto', completed: false }
  ];

  const detectedSystems: DetectedSystem[] = [
    {
      type: 'excel',
      name: 'File Excel Locali',
      location: 'C:/Users/Documents/Excel Files (127 file)',
      confidence: 95,
      icon: <ExcelIcon className="w-8 h-8 text-green-500" />
    },
    {
      type: 'folder',
      name: 'Cartella Condivisa',
      location: '\\\\server\\shared\\documents (active)',
      confidence: 88,
      icon: <ZapierIcon className="w-8 h-8 text-purple-500" />
    },
    {
      type: 'sap',
      name: 'SAP ERP System',
      location: 'sap-prod.company.com (rilevato)',
      confidence: 72,
      icon: <FactoryIcon className="w-8 h-8 text-blue-500" />
    }
  ];

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    // Simula detection
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsDetecting(false);
    setCurrentStep(2);
  };

  const handleSystemSelect = (system: DetectedSystem) => {
    setSelectedSystem(system);
  };

  const handleTestConnection = async () => {
    if (!selectedSystem) return;

    setIsTesting(true);
    setTestResult(null);

    // Simula test connessione
    await new Promise(resolve => setTimeout(resolve, 2500));

    const success = Math.random() > 0.3; // 70% successo
    setTestResult(success ? 'success' : 'error');
    setIsTesting(false);

    if (success) {
      setTimeout(() => {
        setCurrentStep(4);
        generateConfig();
      }, 1500);
    }
  };

  const generateConfig = () => {
    const config = `// Configurazione MCP Auto-Generata
// Sistema: ${selectedSystem?.name}
// Tipo: ${selectedSystem?.type}

export const mcpConfig = {
  type: '${selectedSystem?.type}',
  name: '${selectedSystem?.name}',
  location: '${selectedSystem?.location}',
  settings: {
    autoSync: true,
    interval: 300000, // 5 minuti
    retryAttempts: 3,
    batchSize: 100
  },
  authentication: {
    // TODO: Configurare credenziali
    ${selectedSystem?.type === 'sap' ? 'username: "YOUR_USERNAME",' : ''}
    ${selectedSystem?.type === 'sap' ? 'password: "YOUR_PASSWORD",' : ''}
    ${selectedSystem?.type === 'folder' ? 'path: "YOUR_SHARED_PATH",' : ''}
  }
};

// Inizializzazione automatica
mcpConfig.init().then(() => {
  console.log('MCP Ready!');
});`;
    setGeneratedConfig(config);
  };

  const handleComplete = () => {
    onComplete({
      system: selectedSystem,
      config: generatedConfig
    });
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center py-8">
            <div className="mb-6">
              {isDetecting ? (
                <SpinnerIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              ) : (
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ZapierIcon className="w-8 h-8 text-blue-400" />
                </div>
              )}

              <h3 className={SydDesign.text.subtitle}>
                {isDetecting ? 'Scansione in corso...' : 'Rileva Sistemi Automaticamente'}
              </h3>
              <p className={SydDesign.text.normal}>
                {isDetecting
                  ? 'Analizzando rete, cartelle e servizi disponibili'
                  : 'Trova e configura automaticamente le tue sorgenti dati'
                }
              </p>
            </div>

            {!isDetecting && (
              <button
                onClick={handleAutoDetect}
                className={`${SydDesign.buttons.gradients.blue} text-white px-8 py-3 ${SydDesign.buttons.borderRadius} ${SydDesign.buttons.shadow} ${SydDesign.buttons.transform} ${SydDesign.buttons.transition}`}
              >
                Inizia Auto-Detection
              </button>
            )}

            {isDetecting && (
              <div className="space-y-2 text-sm text-slate-400">
                <p>• Scansione cartelle locali...</p>
                <p>• Verifica connessioni di rete...</p>
                <p>• Ricerca servizi SAP...</p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <div className="mb-6">
              <h3 className={SydDesign.text.subtitle}>Sistemi Rilevati</h3>
              <p className={SydDesign.text.normal}>Seleziona il sistema da configurare</p>
            </div>

            <div className="space-y-4">
              {detectedSystems.map((system, index) => (
                <div
                  key={index}
                  onClick={() => handleSystemSelect(system)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedSystem?.name === system.name
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {system.icon}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={SydDesign.text.normal}>{system.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          system.confidence > 80 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {system.confidence}% match
                        </span>
                      </div>
                      <p className={SydDesign.text.small}>{system.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedSystem && (
              <button
                onClick={() => setCurrentStep(3)}
                className={`w-full mt-6 ${SydDesign.buttons.gradients.blue} text-white py-3 ${SydDesign.buttons.borderRadius} ${SydDesign.buttons.shadow} ${SydDesign.buttons.transform} ${SydDesign.buttons.transition}`}
              >
                Procedi al Test → {selectedSystem.name}
              </button>
            )}
          </div>
        );

      case 3:
        return (
          <div className="text-center py-8">
            <div className="mb-6">
              {isTesting ? (
                <SpinnerIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              ) : testResult === 'success' ? (
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              ) : testResult === 'error' ? (
                <AlertIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              ) : (
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  {selectedSystem?.icon}
                </div>
              )}

              <h3 className={SydDesign.text.subtitle}>
                {isTesting ? 'Test in corso...' :
                 testResult === 'success' ? 'Connessione Riuscita!' :
                 testResult === 'error' ? 'Errore di Connessione' :
                 'Test Connessione'}
              </h3>

              <p className={SydDesign.text.normal}>
                {isTesting ? `Verificando ${selectedSystem?.name}` :
                 testResult === 'success' ? 'Sistema pronto per l\'uso' :
                 testResult === 'error' ? 'Controlla credenziali e connettività' :
                 `Verifichiamo la connessione a ${selectedSystem?.name}`}
              </p>
            </div>

            {!isTesting && !testResult && (
              <button
                onClick={handleTestConnection}
                className={`${SydDesign.buttons.gradients.blue} text-white px-8 py-3 ${SydDesign.buttons.borderRadius} ${SydDesign.buttons.shadow} ${SydDesign.buttons.transform} ${SydDesign.buttons.transition}`}
              >
                Testa Connessione
              </button>
            )}

            {testResult === 'error' && (
              <div className="space-y-4">
                <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">
                  Impossibile connettersi. Verifica credenziali e permessi.
                </div>
                <button
                  onClick={handleTestConnection}
                  className={`${SydDesign.buttons.gradients.blue} text-white px-6 py-2 ${SydDesign.buttons.borderRadius}`}
                >
                  Riprova
                </button>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div>
            <div className="mb-6">
              <h3 className={SydDesign.text.subtitle}>Configurazione Generata</h3>
              <p className={SydDesign.text.normal}>
                Codice pronto per {selectedSystem?.name}
              </p>
            </div>

            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 mb-6">
              <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                {generatedConfig}
              </pre>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(generatedConfig)}
                className={`flex-1 ${SydDesign.buttons.gradients.teal} text-white py-3 ${SydDesign.buttons.borderRadius} ${SydDesign.buttons.shadow} ${SydDesign.buttons.transform} ${SydDesign.buttons.transition}`}
              >
                Copia Codice
              </button>
              <button
                onClick={handleComplete}
                className={`flex-1 ${SydDesign.buttons.gradients.blue} text-white py-3 ${SydDesign.buttons.borderRadius} ${SydDesign.buttons.shadow} ${SydDesign.buttons.transform} ${SydDesign.buttons.transition}`}
              >
                Completa Setup
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <StyledCard>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <h2 className={SydDesign.text.subtitle}>Setup Guidato MCP</h2>
            </div>
            <span className={SydDesign.text.small}>
              {currentStep}/4
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center ${step.id < steps.length ? 'flex-1' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    step.id <= currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {step.id <= currentStep ? (
                      step.id < currentStep ? <CheckCircleIcon className="w-4 h-4" /> : step.id
                    ) : step.id}
                  </div>
                  {step.id < steps.length && (
                    <div className={`flex-1 h-0.5 mx-2 ${
                      step.id < currentStep ? 'bg-blue-500' : 'bg-slate-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs">
              {steps.map((step) => (
                <div key={step.id} className={`text-center ${step.id === 4 ? 'text-right' : ''}`}>
                  <p className={step.id <= currentStep ? 'text-blue-400' : 'text-slate-500'}>
                    {step.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            {renderStepContent()}
          </div>

        </StyledCard>
      </div>
    </div>
  );
};

export default MCPWizard;