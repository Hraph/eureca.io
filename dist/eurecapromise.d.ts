export declare class EurecaPromise<T> extends Promise<T> {
    sig: string;
    resolve: any;
    reject: any;
    constructor(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void);
    onReady(onfullfilled: any, onrejected: any): Promise<T>;
}
