export default function overrideDateToJSON() {
    Date.prototype.toJSON = function() {
      return this.toISOString().slice(0, 10);
    };
  }
  