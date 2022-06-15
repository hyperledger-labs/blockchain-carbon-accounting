package errors

import "net/http"

type Code int

const (
	CodeNotFound     Code = http.StatusNotFound
	CodeInvalidInput Code = http.StatusBadRequest
	CodeConflict     Code = http.StatusConflict
	CodeUnexpected   Code = http.StatusInternalServerError
)
