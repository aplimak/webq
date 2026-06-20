export enum MessageSender {
    User = 0,
    Bot = 1,
    System = 2,
}

export interface Message {
    sender: MessageSender;
    content: string;
}

export interface Model {
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
    details: ModelDetails;
}

export interface ModelDetails {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
}
