import { GoogleGenAI } from '@google/genai';

// Helper to get AI instance with current API key
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Configuração de IA pendente. Por favor, aguarde ou verifique as configurações.');
  }
  return new GoogleGenAI({ apiKey });
}

const SYSTEM_INSTRUCTION = `
Você é um parceiro criativo inteligente, mentor de design e assistente especializado em Canva, focado principalmente em design esportivo.
Seu objetivo é ajudar designers gráficos a desenvolver ideias, melhorar artes, gerar conceitos criativos e trabalhar com eficiência no Canva.

Diretrizes de Comportamento:
1. Seja direto, profissional, mas com um tom inspirador e enérgico (vibe esportiva).
2. Sempre que sugerir elementos para buscar no Canva, forneça o nome em português e em inglês (ex: Português: partículas energia | Inglês: energy particles).
3. Chame o usuário pelo primeiro nome ocasionalmente para criar proximidade.
4. Faça perguntas naturais para entender melhor o estilo, objetivos e preferências do usuário, mas sem parecer um formulário.
5. Se o usuário pedir para iniciar um projeto, estruture a resposta em etapas: 1) Conceito, 2) Estrutura, 3) Efeitos, 4) Elementos Canva, 5) Variações.
6. Se identificar que uma ideia pode virar um bom conteúdo para redes sociais, adicione uma seção "Radar de Conteúdo" sugerindo formatos (ex: post carrossel, reels, tutorial).
7. DESTAQUE INTELIGENTE: Use a tag HTML <mark>texto importante</mark> para destacar APENAS as partes mais críticas e importantes da sua resposta (ex: conceitos chave, dicas de ouro, ferramentas essenciais). Use com moderação, não exagere.
`;

export async function generateChatResponse(
  userMessage: string, 
  previousMessages: any[], 
  userProfile: any, 
  imageFiles?: { base64: string, mimeType: string }[], 
  isProject: boolean = false
) {
  try {
    const ai = getAI();
    const modelName = 'gemini-3-flash-preview';

    const history = previousMessages.map(msg => {
      const parts: any[] = [{ text: msg.content }];
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts
      };
    });

    const userParts: any[] = [{ text: userMessage || 'Analise esta imagem.' }];
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach(img => {
        userParts.unshift({
          inlineData: {
            data: img.base64,
            mimeType: img.mimeType
          }
        });
      });
    }

    let currentInstruction = SYSTEM_INSTRUCTION;
    if (isProject) {
      currentInstruction += `\n\nATENÇÃO: Este é um chat no MODO PROJETO. 
      Você DEVE organizar suas respostas seguindo estritamente esta estrutura:
      1) Conceito da arte
      2) Estrutura da composição
      3) Efeitos sugeridos
      4) Elementos para buscar no Canva (com nomes em PT e EN)
      5) Variações possíveis`;
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...history,
        { role: 'user', parts: userParts }
      ],
      config: {
        systemInstruction: `${currentInstruction}\n\nNome do usuário: ${userProfile?.name || 'Designer'}\nDNA Criativo (Preferências): ${JSON.stringify(userProfile?.creativeDNA || {})}\n\nINSTRUÇÃO ADICIONAL: Se o usuário precisar de inspiração visual ou referências, use o Google Search. Se o usuário pedir para criar ou gerar uma imagem, retorne um bloco no formato: [GENERATE_IMAGE: descrição detalhada em inglês]. Sempre forneça links oficiais para ferramentas e recursos sugeridos.`,
        temperature: 0.7,
        tools: [{ googleSearch: {} }, { urlContext: {} }],
      }
    });

    return {
      text: response.text || 'Desculpe, não consegui gerar uma resposta.',
      groundingMetadata: JSON.parse(JSON.stringify(response.candidates?.[0]?.groundingMetadata || null))
    };
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    if (error.message?.includes('API key')) {
      throw new Error('Chave de API inválida ou não configurada.');
    }
    throw new Error('Erro ao processar sua mensagem. Por favor, tente novamente.');
  }
}

export async function autoCorrectText(text: string) {
  if (!text.trim()) return text;
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Corrija a ortografia, gramática, acentuação e pontuação do seguinte texto. 
      Mantenha exatamente o mesmo sentido e naturalidade da frase original. 
      Não adicione explicações, retorne APENAS o texto corrigido.
      
      Texto original: "${text}"`,
      config: {
        temperature: 0.1,
      }
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error('Auto-correct error:', error);
    return text;
  }
}

export async function generateImage(prompt: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error('Nenhuma imagem gerada.');
  } catch (error: any) {
    console.error('Image generation error:', error);
    if (error.status === 429 || error.code === 429 || (error.message && error.message.includes('429'))) {
      throw new Error('Limite de geração de imagens atingido. Tente novamente mais tarde.');
    }
    throw error;
  }
}

export async function improvePrompt(prompt: string) {
  if (!prompt.trim()) return prompt;
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Reescreva o seguinte pedido de um designer para torná-lo mais claro, detalhado e eficiente para uma IA de design esportivo. 
      Retorne APENAS o prompt melhorado, sem explicações adicionais.
      
      Pedido original: "${prompt}"`,
      config: {
        temperature: 0.3,
      }
    });
    return response.text?.trim() || prompt;
  } catch (error) {
    console.error('Improve prompt error:', error);
    return prompt;
  }
}

export async function extractAndImprovePrompt(aiResponse: string) {
  if (!aiResponse.trim()) throw new Error('Nenhuma resposta disponível para extrair');
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise a seguinte resposta de uma IA e extraia o prompt de design implícito ou explícito nela.
      
      Resposta da IA: "${aiResponse}"
      
      Seu objetivo é transformar essa resposta em um sistema de prompts estruturados.
      Retorne um objeto JSON com a seguinte estrutura:
      {
        "extracted": "O prompt extraído da resposta, removendo redundâncias e linguagem informal.",
        "improved": "Uma versão otimizada, mais clara, específica e profissional do prompt extraído.",
        "variations": [
          {
            "level": "Básico",
            "content": "Versão simples e direta do prompt.",
            "label": "Básico"
          },
          {
            "level": "Avançado",
            "content": "Versão estruturada e detalhada do prompt.",
            "label": "Avançado"
          },
          {
            "level": "Expert",
            "content": "Versão estratégica, detalhada e ultra-otimizada do prompt.",
            "label": "Expert"
          }
        ],
        "ultraExpert": "Uma versão ainda melhor, nível expert avançado, com técnicas de engenharia de prompt."
      }
      
      Regras:
      1. Remova explicações desnecessárias.
      2. Foque em objetivos, instruções, requisitos e contexto.
      3. Use um tom profissional e eficiente para IA.
      4. Retorne APENAS o JSON.`,
      config: {
        temperature: 0.4,
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text;
    if (!text) throw new Error('Falha ao gerar prompts.');
    return JSON.parse(text);
  } catch (error) {
    console.error('Extract prompt error:', error);
    throw error;
  }
}
