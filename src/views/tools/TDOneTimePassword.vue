<template>
  <div class="container">
    <div class="title">
      Time-based (TOTP) and HMAC-based (HOTP) One-Time Password!
    </div>
    <div class="note">Note: HOTP not tested</div>
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
    <div class="flex">
      <TDInput
        v-model="password"
        :placeHolder="'Enter password to open saved Authenticator'"
      />
      <TDButton label="Open" :readOnly="!password" @click="openAuthenSaved" />
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
    <div class="otp-container">
      <template v-for="(item, index) in decodedData">
        <div class="otp-item">
          <div>
            <div class="otp-name">{{ item.displayName }}</div>
            <div class="otp-type">{{ item.type }}</div>
          </div>
          <div v-if="item.type.compareNotSentive('HOTP')">NotSupported</div>
          <div v-else class="otp-value">{{ item.otp }}</div>
        </div>
      </template>
    </div>
  </div>
</template>
<script>
import protobuf from "protobufjs";
import base32 from "hi-base32";
import { Buffer } from "buffer";
import * as OTPAuth from "otpauth";

export default {
  name: "TDOneTimePassword",
  created() {
    let me = this;
  },
  computed: {
    isShowDecoded() {
      let me = this;
      let result = false;
      if (
        me.decodedData &&
        window.__env.oneTimePasswordAuthen &&
        window.__env.oneTimePasswordAuthen.showDecodedInfo
      ) {
        result = true;
      }
      return result;
    },
  },
  mounted() {},
  beforeUnmount() {
    let me = this;
    // Clean up interval when the component is destroyed
    if (me.intervalId) {
      clearInterval(me.intervalId);
    }
  },
  methods: {
    async decodeGoogleAuth() {
      let me = this;
      let result = await me.decodeExportUri(me.migrationURL);
      if (result) {
        me.decodedData = result;
        me.buildData();
        me.decodedDataString = JSON.stringify(result, null, 2);
        me.intervalId = setInterval(() => {
          me.generateTOTP();
        }, 10000); // 30,000 ms (30 seconds)
      }
    },
    buildData() {
      let me = this;
      if (me.decodedData && me.decodedData.length > 0) {
        me.decodedData.forEach((item) => {
          if (item.issuer) {
            item.displayName = item.issuer + " - " + item.name;
          } else {
            item.displayName = item.name;
          }
        });
      }
    },
    /**
     * Generate TOTP code from the decoded data.
     */
    generateTOTP() {
      let me = this;
      if (me.decodedData && me.decodedData.length > 0) {
        me.decodedData.forEach((item) => {
          // chỉ tự động interval cho TOTP thôi
          if (item.type.compareNotSentive("TOTP")) {
            let totp = new OTPAuth.TOTP({
              issuer: item.issuer,
              label: item.name,
              secret: item.secret,
              algorithm: item.algorithm,
              digits: item.digits.compareNotSentive("six") ? 6 : 8,
              digits: 6,
              // Interval of time for which a token is valid, in seconds.
              period: 30,
            });
            item.otp = totp.generate();
          }
        });
      }
    },

    generateHOTP(item) {
      let me = this;
      if (item && item.type.compareNotSentive("HOTP")) {
        let hotp = new OTPAuth.HOTP({
          issuer: item.issuer,
          label: item.name,
          secret: item.secret,
          algorithm: item.algorithm,
          digits: item.digits.compareNotSentive("six") ? 6 : 8,
          counter: item.counter,
        });
        item.otp = hotp.generate();
      }
    },

    openAuthenSaved() {
      let me = this;
      debugger;
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
        account.secret = me.toBase32(account.secret);
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
      password: null,
      intervalId: null,
    };
  },
};
</script>
<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: var(--padding);
}
.note {
  color: var(--warning-color);
  margin: var(--padding);
}
.td-decoded-data {
  padding: var(--padding);
}
.otp-container {
  display: grid;
  gap: 1rem;
  justify-content: center;
  align-items: start;
  align-items: stretch;
}

/* Grid responsive cho các mã QR */
@media screen and (max-width: 900px) {
  .otp-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media screen and (min-width: 901px) and (max-width: 1400px) {
  .otp-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (min-width: 1401px) and (max-width: 2100px) {
  .otp-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (min-width: 2101px) {
  .otp-container {
    grid-template-columns: repeat(4, 1fr);
  }
}
.otp-item {
  display: flex;
  justify-content: space-between;
  padding: var(--padding);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  margin: var(--padding);
  .otp-name {
    font-weight: bold;
  }
  .otp-value {
    font-size: 30px;
    color: var(--focus-color);
  }
  .otp-type {
    font-size: 12px;
    color: var(--focus-color);
  }
}
</style>
