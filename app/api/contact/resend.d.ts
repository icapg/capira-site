// Declaración temporal hasta que se instale el paquete: npm install resend
declare module "resend" {
  export class Resend {
    constructor(apiKey: string | undefined);
    emails: {
      send(params: {
        from: string;
        to: string;
        replyTo?: string;
        subject: string;
        html: string;
      }): Promise<{ data: unknown; error: unknown }>;
    };
  }
}
