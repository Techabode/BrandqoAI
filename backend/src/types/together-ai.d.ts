declare module "together-ai" {
    interface InferenceOptions {
        prompt: string;
        max_tokens?: number;
        temperature?: number;
        top_p?: number;
        top_k?: number;
        [key: string]: any;
    }

    interface InferenceResponse {
        status: string;
        prompt: string[];
        model: string;
        model_owner: string;
        tags: Record<string, unknown>;
        num_returns: number;
        args: {
            model: string;
            prompt: string;
            max_tokens: number;
            stop: string;
            temperature: number;
            top_p: number;
            top_k: number;
            repetition_penalty: number;
        };
        subjobs: any[];
        output: {
            choices: Array<{
                text: string;
            }>;
            request_id: string;
        };
    }

    class Together {
        authApiKey: string | null;
        constructor(options: { auth: string });
        inference(model: string, options: InferenceOptions): Promise<InferenceResponse>;
    }

    export default Together;
}
