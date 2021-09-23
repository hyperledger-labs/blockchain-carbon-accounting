package errors

import "fmt"

type (
	Op       string
	Severity uint
)

// specific paramaters

type (
	Chaincode string
	TxID      string
)

const (
	SeverityError Severity = iota + 1
	SeverityWarn
	SeverityInfo
	SeverityDebug
)

type Error struct {
	op       Op       // operations , name of the functions that is calling
	code     Code     // category of errors
	err      error    // stack of errors
	severity Severity // based upon this error will be logged

	// specific paramaters
	chaincode Chaincode
	txID      TxID
}

// Error : implementing error interface
// provided by go.
func (e *Error) Error() string {
	return e.err.Error()
}

func Wrap(err error, msg string) {
	e, ok := err.(*Error)
	if ok {
		e.err = fmt.Errorf("%s : %w", msg, e.err)
	}
}

// E : creates a new error
// and place it on to existing stack
func E(args ...interface{}) error {
	e := &Error{}
	for _, arg := range args {
		switch arg := arg.(type) {
		case Op:
			e.op = arg
		case Code:
			e.code = arg
		case error:
			e.err = arg
		case Severity:
			e.severity = arg
		// specific paramaters
		case Chaincode:
			e.chaincode = arg
		case TxID:
			e.txID = arg
		default:
			panic("bad call to E")
		}
	}
	return e
}

// Ops : returns list of operations from
// the error stack
func Ops(err error) []Op {
	e, ok := err.(*Error)
	if !ok {
		return nil
	}
	res := []Op{e.op}
	subErr, ok := e.err.(*Error)
	if !ok {
		return res
	}
	res = append(res, Ops(subErr)...)
	return res
}

// ErrCode : return first found error code
// in error stack
func ErrCode(err error) Code {
	e, ok := err.(*Error)
	if !ok {
		return CodeUnexpected
	}
	if e.code > 0 {
		return e.code
	}
	return ErrCode(e.err)
}

// ErrCode : return first found Severity
// in error stack
func Level(err error) Severity {
	e, ok := err.(*Error)
	if !ok {
		return SeverityError
	}
	if e.severity != 0 {
		return e.severity
	}
	return Level(e.err)
}

// ErrCode : return first found chaincode name
// in error stack
func CC(err error) Chaincode {
	e, ok := err.(*Error)
	if !ok {
		return Chaincode("")
	}
	if e.chaincode != "" {
		return e.chaincode
	}
	return CC(e.err)
}

// ErrCode : return first found txID
// in error stack
func GetTxID(err error) TxID {
	e, ok := err.(*Error)
	if !ok {
		return TxID("")
	}
	if e.txID != "" {
		return e.txID
	}
	return GetTxID(e.err)
}
