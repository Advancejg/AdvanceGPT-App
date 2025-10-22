// AdvanceGPT - Sistema de IA Personal con Gemini Pro
// Configuración y variables globales

const CONFIG = {
    GEMINI_API_KEY: '', // El usuario debe agregar su API key
    GEMINI_API_URL: '/api/gemini'
    ,    MAX_HISTORY: 50,
    STORAGE_KEY: 'advancegpt_chat_history',
    SETTINGS_KEY: 'advancegpt_settings'
};

// Estado de la aplicación
const state = {
    chatHistory: [],
    isProcessing: false,
    currentSession: null,
    settings: {
        autoSave: true,
        theme: 'dark',
        notifications: true
    }
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadChatHistory();
    checkAPIKey();
});

// Inicializar aplicación
function initializeApp() {
    console.log('🚀 AdvanceGPT iniciando...');
    state.currentSession = Date.now();
    loadSettings();
    displayWelcomeMessage();
}

// Configurar event listeners
function setupEventListeners() {
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');
    const clearButton = document.getElementById('clear-chat');
    const exportButton = document.getElementById('export-chat');
    const apiKeyButton = document.getElementById('set-api-key');

    if (sendButton) {
        sendButton.addEventListener('click', handleSendMessage);
    }

    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }

    if (clearButton) {
        clearButton.addEventListener('click', clearChat);
    }

    if (exportButton) {
        exportButton.addEventListener('click', exportChat);
    }

    if (apiKeyButton) {
        apiKeyButton.addEventListener('click', showAPIKeyModal);
    }
}

// Verificar API Key
function checkAPIKey() {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        CONFIG.GEMINI_API_KEY = savedKey;
        showNotification('✅ API Key cargada correctamente', 'success');
    } else {
        showNotification('⚠️ Por favor configura tu API Key de Gemini', 'warning');
        setTimeout(showAPIKeyModal, 2000);
    }
}

// Mostrar modal de API Key
function showAPIKeyModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h3 class="text-xl font-bold mb-4">Configurar API Key de Gemini</h3>
            <p class="text-gray-300 mb-4">Obtén tu API key gratuita en: <a href="https://makersuite.google.com/app/apikey" target="_blank" class="text-blue-400 underline">Google AI Studio</a></p>
            <input type="password" id="api-key-input" placeholder="Ingresa tu API Key" class="w-full p-3 bg-gray-700 rounded mb-4">
            <div class="flex gap-2">
                <button onclick="saveAPIKey()" class="flex-1 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded">Guardar</button>
                <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Guardar API Key
function saveAPIKey() {
    const input = document.getElementById('api-key-input');
    const apiKey = input.value.trim();
    
    if (!apiKey) {
        showNotification('❌ Por favor ingresa una API Key válida', 'error');
        return;
    }
    
    localStorage.setItem('gemini_api_key', apiKey);
    CONFIG.GEMINI_API_KEY = apiKey;
    showNotification('✅ API Key guardada exitosamente', 'success');
    document.querySelector('.fixed').remove();
}

// Manejar envío de mensajes
async function handleSendMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    
    if (!message || state.isProcessing) return;
    
   }
    
    // Limpiar input
    userInput.value = '';
    
    // Agregar mensaje del usuario
    addMessage(message, 'user');
    state.isProcessing = true;
    
    // Mostrar indicador de escritura
    showTypingIndicator();
    
    try {
        const response = await sendToGemini(message);
        removeTypingIndicator();
        addMessage(response, 'assistant');
    } catch (error) {
        removeTypingIndicator();
        addMessage(`Error: ${error.message}`, 'error');
        showNotification('❌ Error al procesar mensaje', 'error');
    }
    
    state.isProcessing = false;
    saveChatHistory();
}

// Enviar mensaje a Gemini Pro
async function sendToGemini(message) {
    const url = CONFIG.GEMINI_API_URL;    
    const requestBody = {
        contents: [{
            parts: [{
                text: message
            }]
        }],
        generationConfig: {
            temperature: 0.9,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
        },
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Error en la API');
    }
    
    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'No se recibió respuesta';
}

// Agregar mensaje al chat
function addMessage(content, role) {
    const chatContainer = document.getElementById('chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message bg-gray-${role === 'user' ? '800' : '700'}/50 p-4 rounded-lg border border-gray-700`;
    
    const timestamp = new Date().toLocaleTimeString();
    const icon = role === 'user' ? '👤' : (role === 'assistant' ? '🤖' : '⚠️');
    
    messageDiv.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="text-2xl">${icon}</div>
            <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                    <span class="text-gray-300">${timestamp}</span>
                </div>
                <div class="text-gray-300">${formatMessage(content)}</div>
            </div>
        </div>
    `;
    
    if (!chatContainer) {
        console.error('Chat container not found');
        return;
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Guardar en historial
    state.chatHistory.push({
        role,
        content,
        timestamp: Date.now()
    });
}

// Formatear mensaje
function formatMessage(text) {
    // Convertir markdown básico a HTML
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/`(.*?)`/g, '<code class="bg-gray-800 px-1 rounded">$1</code>');
    text = text.replace(/\n/g, '<br>');
    return text;
}

// Indicador de escritura
function showTypingIndicator() {
    const chatContainer = document.getElementById('chat-container');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'message bg-gray-700/50 p-4 rounded-lg border border-gray-700';
    typingDiv.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="text-2xl">🤖</div>
            <div class="flex gap-1">
                <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style="animation-delay: 0.2s"></span>
                <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style="animation-delay: 0.4s"></span>
            </div>
        </div>
    `;
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

// Mensaje de bienvenida
function displayWelcomeMessage() {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;
    
    const welcomeMsg = `
        <div class="text-center p-8">
            <h2 class="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                ¡Bienvenido a AdvanceGPT! 🚀
            </h2>
            <p class="text-gray-300 mb-4">Tu asistente de IA personal impulsado por Gemini Pro</p>
            <div class="text-left max-w-md mx-auto text-sm text-gray-400">
                <p class="mb-2">✨ Características:</p>
                <ul class="list-disc list-inside space-y-1">
                    <li>Chat inteligente con memoria contextual</li>
                    <li>Integración con Gemini Pro</li>
                    <li>Historial de conversaciones</li>
                    <li>Exportación de chats</li>
                    <li>100% gratuito</li>
                </ul>
            </div>
        </div>
    `;
    chatContainer.innerHTML = welcomeMsg;
}

// Limpiar chat
function clearChat() {
    if (!confirm('¿Estás seguro de que quieres limpiar el chat?')) return;
    
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        state.chatHistory = [];
        saveChatHistory();
        displayWelcomeMessage();
        showNotification('🗑️ Chat limpiado', 'success');
    }
}

// Exportar chat
function exportChat() {
    if (state.chatHistory.length === 0) {
        showNotification('⚠️ No hay mensajes para exportar', 'warning');
        return;
    }
    
    const exportData = {
        exported: new Date().toISOString(),
        messages: state.chatHistory
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `advancegpt-chat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('📥 Chat exportado exitosamente', 'success');
}

// Guardar historial
function saveChatHistory() {
    if (!state.settings.autoSave) return;
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.chatHistory));
    } catch (error) {
        console.error('Error saving chat history:', error);
    }
}

// Cargar historial
function loadChatHistory() {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            state.chatHistory = JSON.parse(saved);
            // Restaurar mensajes en la UI
            state.chatHistory.forEach(msg => {
                addMessage(msg.content, msg.role);
            });
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

// Cargar configuraciones
function loadSettings() {
    try {
        const saved = localStorage.getItem(CONFIG.SETTINGS_KEY);
        if (saved) {
            state.settings = { ...state.settings, ...JSON.parse(saved) };
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Guardar configuraciones
function saveSettings() {
    try {
        localStorage.setItem(CONFIG.SETTINGS_KEY, JSON.stringify(state.settings));
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

// Notificaciones
function showNotification(message, type = 'info') {
    if (!state.settings.notifications) return;
    
    const notification = document.createElement('div');
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Exponer funciones globales necesarias
window.saveAPIKey = saveAPIKey;
window.handleSendMessage = handleSendMessage;

console.log('✅ AdvanceGPT cargado correctamente');
