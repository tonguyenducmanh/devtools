//go:build darwin && arm64

package duckdb

import _ "embed"

//go:embed cli/duckdb-darwin-arm64
var embeddedCLIBinary []byte
