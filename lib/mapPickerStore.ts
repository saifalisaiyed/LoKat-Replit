type PickedLocation = {
  lat: number;
  lng: number;
  name: string;
  address: string;
};

let _pending: PickedLocation | null = null;

export function setPickedLocation(loc: PickedLocation) {
  _pending = loc;
}

export function consumePickedLocation(): PickedLocation | null {
  const loc = _pending;
  _pending = null;
  return loc;
}
