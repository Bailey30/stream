export default class Room {
  static #initiator = null;
  static #viewer = null;

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
