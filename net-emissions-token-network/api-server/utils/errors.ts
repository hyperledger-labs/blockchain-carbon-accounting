// a simple error class where we can define the error status code and a message
// that will be returned to the client
export class ApplicationError extends Error {
    status!: number
    message!: string
    constructor(message?: string, status?: number) {
        super();

        Error.captureStackTrace(this, this.constructor);

        this.name = this.constructor.name;

        this.message = message || 
            'Something went wrong. Please try again.';

        this.status = status || 500;
    }
}

