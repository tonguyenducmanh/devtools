//go:build windows && amd64

package duckdb

import _ "embed"

//go:embed cli/duckdb-windows-amd64.exe
var embeddedCLIBinary []byte