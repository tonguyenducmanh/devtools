//go:build linux && amd64

package duckdb

import _ "embed"

//go:embed cli/duckdb-linux-amd64
var embeddedCLIBinary []byte