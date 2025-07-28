export default class Room {
  static #initiator = null;
  static #viewer = null;
  static #users = new Map();

  static set initiator(userId) {
    this.#initiator = userId;
  }

  static get initiator() {
    return this.#initiator;
  }

  static set viewer(userId) {
    this.#viewer = userId;
  }

  static get viewer() {
    return this.#viewer;
  }

  static join(userId) {
    if (
      (!this.#initiator && !this.#viewer) ||
      (!this.#initiator && this.#viewer)
    ) {
      this.#initiator = userId;
    } else {
      this.#viewer = userId;
    }

    // TODO: handle more than two users. Reject connection.
  }

  static leave(userId) {
    if (this.#initiator === userId) {
      this.#initiator = null;
    }
    if (this.#viewer === userId) {
      this.#viewer = null;
    }
  }

  static handleConnection(userId) {
    const count = this.#users.get(userId) || 0;
    this.#users.set(userId, count + 1);
    return count === 0;
  }

  static handleDisconnection(userId) {
    const count = this.#users.get(userId) - 1;
    if (count === 0) {
      this.#users.delete(userId);
    } else {
      this.#users.set(userId, count);
    }
    return count === 0;
  }

  static log() {
    console.log(
      `[Room Members]: [initiator: ${this.#initiator}. viewer: ${this.viewer}]`,
    );
  }

  static fields() {
    return {
      initiator: this.#initiator,
      viewer: this.#viewer,
    };
  }

  static otherUser(userId) {
    if (this.#initiator === userId) {
      return this.#viewer;
    }
    if (this.#viewer === userId) {
      return this.#initiator;
    }
  }
}
