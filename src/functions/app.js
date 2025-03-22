const { app } = require('@azure/functions');
const axios = require('axios');

// Azure 配置
const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT;
const AZURE_API_KEY = process.env.AZURE_API_KEY;
const AZURE_API_VERSION = process.env.AZURE_API_VERSION || "2025-01-01-preview";

// 模型到部署名称的映射，左侧为请求名称，右侧为部署名称
const MODEL_DEPLOYMENT_MAP = {
    "Phi-4-multimodal-instruct": "Phi-4-multimodal-instruct",
    "gpt-4o": "gpt-4o",
    "Phi-3.5-vision-instruct": "Phi-3.5-vision-instruct"
};

app.http('chatCompletions', {
    route: 'v1/chat/completions',
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            // 1. 解析请求
            const reqBody = await request.json();
            const { model, messages, temperature, max_tokens, top_p, stream } = reqBody;

            // 2. 验证必要参数
            if (!messages || !Array.isArray(messages)) {
                return {
                    status: 400,
                    jsonBody: {
                        error: {
                            message: "Missing or invalid messages array",
                            type: "invalid_request_error"
                        }
                    }
                };
            }

            // 3. 检查模型支持
            const deployment = MODEL_DEPLOYMENT_MAP[model];
            if (!deployment) {
                return {
                    status: 400,
                    jsonBody: {
                        error: {
                            message: `Model ${model} is not supported`,
                            type: "invalid_request_error",
                            code: "unsupported_model"
                        }
                    }
                };
            }

            // 4. 构建 Azure 请求
            const azureUrl = `${AZURE_ENDPOINT}/openai/deployments/${deployment}/chat/completions?api-version=${AZURE_API_VERSION}`;
            
            const requestBody = {
                messages,
                temperature: temperature ?? 1,
                max_tokens: max_tokens ?? 4096,
                top_p: top_p ?? 1,
            };

            // 5. 处理流式请求
            if (stream) {
                requestBody.stream = true;
                const azureResponse = await axios.post(azureUrl, requestBody, {
                    headers: {
                        'api-key': AZURE_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'stream'
                });

                return {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/event-stream'
                    },
                    body: azureResponse.data
                };
            }

            // 6. 普通请求处理
            const response = await axios.post(azureUrl, requestBody, {
                headers: {
                    'api-key': AZURE_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            // 7. 转换响应格式
            const openaiResponse = {
                ...response.data,
                model: model,
                object: "chat.completion"
            };

            if (!openaiResponse.choices?.length) {
                throw new Error('Azure returned empty choices array');
            }

            return {
                status: 200,
                jsonBody: openaiResponse
            };

        } catch (error) {
            context.error('Error:', error);

            // 8. 错误处理
            const statusCode = error.response?.status || 500;
            const errorMessage = error.response?.data?.error?.message || error.message;

            return {
                status: statusCode,
                jsonBody: {
                    error: {
                        message: `Azure API Error: ${errorMessage}`,
                        type: "api_error",
                        code: statusCode.toString()
                    }
                }
            };
        }
    }
});
