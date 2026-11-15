//go:build linux && arm64

package duckdb

import _ "embed"

//go:embed cli/duckdb-linux-arm64
var embeddedCLIBinary []byte