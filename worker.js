export default {
  async fetch(request, env) {

    const response = await fetch(
      "https://nextrip-public-api.azure-api.net/octranspo/gtfs-rt-vp/beta/v1/VehiclePositions?format=json",
      {
        headers: {
          "Ocp-Apim-Subscription-Key": "c288c353e12a4c4b92c3173404d343a8"
        }
      }
    );

    const data = await response.text();

    return new Response(data, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
