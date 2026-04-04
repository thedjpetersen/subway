/**
 * Type declarations for the 'irc' module
 * The irc package doesn't have TypeScript definitions
 */

declare module 'irc' {
  import { EventEmitter } from 'events';

  export interface ClientOptions {
    userName?: string;
    realName?: string;
    password?: string;
    port?: number;
    debug?: boolean;
    showErrors?: boolean;
    autoRejoin?: boolean;
    autoConnect?: boolean;
    channels?: string[];
    secure?: boolean;
    selfSigned?: boolean;
    certExpired?: boolean;
    floodProtection?: boolean;
    floodProtectionDelay?: number;
    sasl?: boolean;
    retryCount?: number;
    retryDelay?: number;
    stripColors?: boolean;
    channelPrefixes?: string;
    messageSplit?: number;
    encoding?: string;
  }

  export interface Message {
    prefix?: string;
    nick?: string;
    user?: string;
    host?: string;
    server?: string;
    rawCommand: string;
    command: string;
    commandType?: string;
    args: string[];
  }

  export class Client extends EventEmitter {
    constructor(server: string, nick: string, options?: ClientOptions);

    opt: {
      server: string;
      nick: string;
    } & ClientOptions;

    conn: unknown;
    chans: Record<string, unknown>;

    connect(retryCount?: number, callback?: () => void): void;
    disconnect(message?: string, callback?: () => void): void;
    send(...args: string[]): void;
    join(channel: string, callback?: () => void): void;
    part(channel: string, message?: string, callback?: () => void): void;
    say(target: string, message: string): void;
    ctcp(target: string, type: string, text: string): void;
    action(target: string, message: string): void;
    notice(target: string, message: string): void;
    whois(nick: string, callback?: (info: unknown) => void): void;
    list(...args: string[]): void;

    // Event handlers
    on(event: 'registered', listener: (message: Message) => void): this;
    on(event: 'motd', listener: (motd: string) => void): this;
    on(event: 'names', listener: (channel: string, nicks: Record<string, string>) => void): this;
    on(event: 'topic', listener: (channel: string, topic: string, nick: string, message: Message) => void): this;
    on(event: 'join', listener: (channel: string, nick: string, message: Message) => void): this;
    on(event: 'part', listener: (channel: string, nick: string, reason: string, message: Message) => void): this;
    on(event: 'quit', listener: (nick: string, reason: string, channels: string[], message: Message) => void): this;
    on(event: 'kick', listener: (channel: string, nick: string, by: string, reason: string, message: Message) => void): this;
    on(event: 'kill', listener: (nick: string, reason: string, channels: string[], message: Message) => void): this;
    on(event: 'message', listener: (nick: string, to: string, text: string, message: Message) => void): this;
    on(event: 'message#', listener: (nick: string, to: string, text: string, message: Message) => void): this;
    on(event: 'selfMessage', listener: (to: string, text: string) => void): this;
    on(event: 'notice', listener: (nick: string, to: string, text: string, message: Message) => void): this;
    on(event: 'ping', listener: (server: string) => void): this;
    on(event: 'pm', listener: (nick: string, text: string, message: Message) => void): this;
    on(event: 'ctcp', listener: (from: string, to: string, text: string, type: string, message: Message) => void): this;
    on(event: 'ctcp-notice', listener: (from: string, to: string, text: string, message: Message) => void): this;
    on(event: 'ctcp-privmsg', listener: (from: string, to: string, text: string, message: Message) => void): this;
    on(event: 'ctcp-version', listener: (from: string, to: string, message: Message) => void): this;
    on(event: 'nick', listener: (oldnick: string, newnick: string, channels: string[], message: Message) => void): this;
    on(event: 'invite', listener: (channel: string, from: string, message: Message) => void): this;
    on(event: '+mode', listener: (channel: string, by: string, mode: string, argument: string, message: Message) => void): this;
    on(event: '-mode', listener: (channel: string, by: string, mode: string, argument: string, message: Message) => void): this;
    on(event: 'mode', listener: (channel: string, by: string, mode: string, argument: string, message: Message) => void): this;
    on(event: 'whois', listener: (info: unknown) => void): this;
    on(event: 'channellist_start', listener: () => void): this;
    on(event: 'channellist_item', listener: (info: { name: string; users: string; topic: string }) => void): this;
    on(event: 'channellist', listener: (list: Array<{ name: string; users: string; topic: string }>) => void): this;
    on(event: 'raw', listener: (message: Message) => void): this;
    on(event: 'error', listener: (message: Message) => void): this;
    on(event: 'abort', listener: (retryCount: number) => void): this;
    on(event: 'netError', listener: (error: Error) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }
}
