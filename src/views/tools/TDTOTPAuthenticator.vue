<template>
  <div class="container">
    <div class="title">Time-based one-time password authenticator tool!</div>
    <div class="flex">
      <TDInput
        v-model="migrationURL"
        :placeHolder="'Google authenticator migration URL exampe: otpauth-migration://offline?data=CjcKFFkwYrPBscVsQXM'"
      />
      <TDButton
        label="Decode"
        :readOnly="!migrationURL"
        @click="decodeGoogleAuth"
      />
    </div>
    <div class="flex td-decoded-data">
      <TDTextarea
        v-if="isShowDecoded"
        placeHolder="Google authenticator decoded data"
        v-model="decodedDataString"
        label="Google authenticator decoded data"
        isLabelTop
        :readOnly="true"
        height="400px"
      ></TDTextarea>
    </div>
  </div>
</template>
<script>
import protobuf from "protobufjs";
import base32 from "base32";
import { Buffer } from "buffer";
export default {
  name: "TDTOTPAuthenticator",
  created() {
    let me = this;
  },
  computed: {
    isShowDecoded() {
      let me = this;
      let result = false;
      if (
        me.decodedData &&
        window.__env.totpAuthenticator &&
        window.__env.totpAuthenticator.showDecodedInfo
      ) {
        result = true;
      }
      return result;
    },
  },
  mounted() {},
  beforeUnmount() {},
  methods: {
    async decodeGoogleAuth() {
      let me = this;
      let result = await me.decodeExportUri(me.migrationURL);
      me.decodedData = result;
      me.decodedDataString = JSON.stringify(result, null, 2);
    },

    /**
     * Google Authenticator uses protobuff to encode the 2fa data.
     *
     * @param {Uint8Array} payload
     */
    async decodeProtobuf(payload) {
      let me = this;
      // bắt buộc phải đặt ở thư mục public thì mới load được
      let response = await fetch("/proto/google_auth.proto"); // Path relative to the public directory
      let protoText = await response.text();
      let root = protobuf.parse(protoText).root;
      let MigrationPayload = root.MigrationPayload;

      let message = MigrationPayload.decode(payload);

      return MigrationPayload.toObject(message, {
        longs: String,
        enums: String,
        bytes: String,
      });
    },

    /**
     * Convert a base64 to base32.
     * Most Time based One Time Password (TOTP)
     * password managers use this as the "secret key" when generating a code.
     *
     * An example is: https://totp.danhersam.com/.
     *
     * @returns RFC3548 compliant base32 string
     */
    toBase32(base64String) {
      let me = this;
      let raw = Buffer.from(base64String, "base64");
      return base32.encode(raw);
    },
    /**
     * The data in the URI from Google Authenticator
     *  is a protobuff payload which is Base64 encoded and then URI encoded.
     * This function decodes those, and then decodes the protobuf data contained inside.
     *
     * @param {String} data the `data` query parameter from the totp migration string that google authenticator outputs.
     */
    async decode(data) {
      let me = this;
      let buffer = Buffer.from(decodeURIComponent(data), "base64");

      let payload = await me.decodeProtobuf(buffer);
      let accounts = payload.otpParameters.map((account) => {
        account.totpSecret = me.toBase32(account.secret);
        return account;
      });

      return accounts;
    },

    /**
     * @param {string} uri The raw QR code uri
     * @returns decoded data with account info
     */
    async decodeExportUri(uri) {
      let me = this;
      let queryParams = new URL(uri).search;
      let data = new URLSearchParams(queryParams).get("data");

      return await me.decode(data);
    },
  },
  data() {
    return {
      migrationURL: null,
      decodedData: null,
      decodedDataString: null,
    };
  },
};
</script>
<style scoped>
.td-decoded-data{
  padding: var(--padding);
}
</style>
