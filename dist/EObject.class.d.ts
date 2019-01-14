export declare class EObject {
    _events: any;
    constructor();
    extend(options: any): void;
    bind(event: any, fct: any): void;
    on(event: any, fct: any): void;
    unbind(event: any, fct: any): void;
    unbindEvent(event: any): void;
    unbindAll(): void;
    trigger(event: any, ...args: any[]): void;
    registerEvent(evtname: string): void;
    registerEvents(eventsArray: string[]): void;
}
